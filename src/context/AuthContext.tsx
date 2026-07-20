import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { hashPassword, securePassword, verifyPassword, needsRehash, generateMasterCode } from '../lib/auth';
import { logAudit, setAuditActor } from '../lib/audit';

// Sign-in lockout: after this many consecutive failures for a username, further
// attempts are blocked for LOCKOUT_MS. Tracked per-username in localStorage so a
// page refresh doesn't reset the counter.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 minute
// Auto sign-out after this much inactivity.
const IDLE_TIMEOUT_MS = 30 * 60_000; // 30 minutes

interface LockState { count: number; until: number }
function loadLockouts(): Record<string, LockState> {
  try { return JSON.parse(localStorage.getItem('gha_lockouts') || '{}'); } catch { return {}; }
}
function saveLockouts(v: Record<string, LockState>) {
  try { localStorage.setItem('gha_lockouts', JSON.stringify(v)); } catch { /* ignore */ }
}

export type UserRole = 'Admin' | 'Cashier' | 'Teacher' | 'Viewer';

export interface AppUser {
  id: string;
  username: string;
  password: string;      // stored as a salted SHA-256 hash (see lib/auth)
  fullName: string;
  role: UserRole;
  email?: string;        // for record only — not used for automated email
  mustReset?: boolean;   // admin flagged this user for a forced password change
}

// A "claim" is a request that lands in the admin's Notification bell —
// forgot-password requests, access requests, etc.
export interface AuthClaim {
  id: string;
  type: 'forgot-password' | 'access-request' | 'info';
  username: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[] | 'all'> = {
  Admin: 'all',
  Cashier: ['dashboard', 'profile', 'students', 'cashier', 'payments', 'bulkfees', 'expenses', 'statements', 'uniforms', 'library', 'debtors', 'transport', 'fundraisers', 'kitchen', 'feestructure', 'reports', 'templates', 'gallery'],
  Teacher: ['dashboard', 'profile', 'students', 'classes', 'attendance', 'results', 'timetable', 'calendar', 'events', 'announcements', 'requirements', 'library', 'reports', 'gallery'],
  Viewer: ['dashboard', 'profile', 'calendar', 'events', 'announcements', 'gallery'],
};

const DEFAULT_USERS: AppUser[] = [
  // Password is the SHA-256 hash of "admin123" for username "admin".
  { id: 'user-1', username: 'admin', password: '', fullName: 'Administrator', role: 'Admin' },
];

function loadUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem('gha_users');
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function loadClaims(): AuthClaim[] {
  try { return JSON.parse(localStorage.getItem('gha_claims') || '[]'); } catch { return []; }
}

// Detect a legacy plain-text password (hashes are 64 hex chars).
const isHashed = (v: string) => /^[a-f0-9]{64}$/.test(v);

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  users: AppUser[];
  claims: AuthClaim[];
  login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: Omit<AppUser, 'password'> & { password: string }) => Promise<void>;
  updateUser: (id: string, user: Partial<AppUser>) => void;
  setUserPassword: (id: string, plainPassword: string) => Promise<void>;
  deleteUser: (id: string) => void;
  canAccess: (sectionId: string) => boolean;
  fileClaim: (type: AuthClaim['type'], username: string, message: string) => void;
  resolveClaim: (id: string) => void;
  clearResolvedClaims: () => void;
  hasMasterCode: boolean;
  setMasterCode: (plainCode: string) => Promise<void>;
  verifyMasterCode: (plainCode: string) => Promise<boolean>;
  generateMasterCode: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadUsers);
  const [claims, setClaims] = useState<AuthClaim[]>(loadClaims);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [hasMasterCode, setHasMasterCode] = useState<boolean>(() => !!localStorage.getItem('gha_master_code'));

  useEffect(() => { localStorage.setItem('gha_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('gha_claims', JSON.stringify(claims)); }, [claims]);

  // One-time migration: hash the default admin password and any legacy plain
  // passwords still stored from before this upgrade.
  useEffect(() => {
    (async () => {
      let changed = false;
      const migrated = await Promise.all(users.map(async u => {
        if (!u.password) {
          // fresh default admin — set the known default (already PBKDF2)
          if (u.username === 'admin') { changed = true; return { ...u, password: await securePassword('admin', 'admin123') }; }
          return u;
        }
        // Legacy plain-text (neither a SHA-256 hash nor PBKDF2) → hash it now.
        if (!isHashed(u.password) && !u.password.startsWith('pbkdf2$')) {
          changed = true; return { ...u, password: await securePassword(u.username, u.password) };
        }
        return u;
      }));
      if (changed) setUsers(migrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const key = usernameOrEmail.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === key || (u.email || '').toLowerCase() === key);

    // Lockout is keyed on whatever was typed, so probing random usernames is
    // also throttled without revealing which accounts exist.
    const locks = loadLockouts();
    const lock = locks[key];
    const now = Date.now();
    if (lock && lock.until > now) {
      const secs = Math.ceil((lock.until - now) / 1000);
      logAudit('login-locked', `Attempt for "${key}" while locked`, key);
      return { ok: false, error: `Too many attempts. Try again in ${secs}s.` };
    }

    const ok = user ? await verifyPassword(user.username, password, user.password) : false;
    if (!user || !ok) {
      const count = (lock && lock.until > now ? lock.count : (lock?.count || 0)) + 1;
      const until = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
      locks[key] = { count: until ? 0 : count, until };
      saveLockouts(locks);
      logAudit('login-failed', `Failed sign-in for "${key}"`, key);
      if (until) return { ok: false, error: `Too many attempts. Locked for ${LOCKOUT_MS / 1000}s.` };
      return { ok: false, error: 'Invalid username/email or password.' };
    }

    // Success — clear any lockout, upgrade a legacy hash, record it.
    delete locks[key];
    saveLockouts(locks);
    if (needsRehash(user.password)) {
      const upgraded = await securePassword(user.username, password);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: upgraded } : u));
    }
    setAuditActor(user.username);
    setCurrentUser(user);
    logAudit('login', `${user.fullName} (${user.role})`, user.username);
    return { ok: true };
  };

  const logout = () => {
    if (currentUser) logAudit('logout', currentUser.fullName, currentUser.username);
    setAuditActor('system');
    setCurrentUser(null);
  };

  const addUser = async (user: Omit<AppUser, 'password'> & { password: string }) => {
    const hashed = await securePassword(user.username, user.password);
    setUsers(prev => [...prev, { ...user, password: hashed }]);
    logAudit('user-added', `${user.fullName} — @${user.username} (${user.role})`);
  };

  const updateUser = (id: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    setCurrentUser(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
  };

  const setUserPassword = async (id: string, plainPassword: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const hashed = await securePassword(user.username, plainPassword);
    updateUser(id, { password: hashed, mustReset: false });
    // Distinguish an admin resetting someone else vs. a user changing their own.
    if (currentUser && currentUser.id === id) logAudit('password-change', currentUser.fullName);
    else logAudit('password-reset', `@${user.username}`);
  };

  const deleteUser = (id: string) => setUsers(prev => {
    const target = prev.find(u => u.id === id);
    if (target?.role === 'Admin' && prev.filter(u => u.role === 'Admin').length <= 1) return prev;
    if (target) logAudit('user-deleted', `${target.fullName} — @${target.username}`);
    return prev.filter(u => u.id !== id);
  });

  const canAccess = (sectionId: string): boolean => {
    if (!currentUser) return false;
    const perms = ROLE_PERMISSIONS[currentUser.role];
    return perms === 'all' || perms.includes(sectionId);
  };

  const fileClaim = (type: AuthClaim['type'], username: string, message: string) => {
    setClaims(prev => [
      { id: `claim-${Date.now()}`, type, username, message, createdAt: new Date().toISOString(), resolved: false },
      ...prev,
    ]);
  };
  const resolveClaim = (id: string) => setClaims(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  const clearResolvedClaims = () => setClaims(prev => prev.filter(c => !c.resolved));

  const setMasterCode = async (plainCode: string) => {
    const hashed = await hashPassword('__master__', plainCode);
    localStorage.setItem('gha_master_code', hashed);
    setHasMasterCode(true);
    logAudit('mastercode-set', 'Master access code updated');
  };
  const verifyMasterCode = async (plainCode: string): Promise<boolean> => {
    const stored = localStorage.getItem('gha_master_code');
    if (!stored) return false;
    return stored === await hashPassword('__master__', plainCode);
  };

  // Auto sign-out after a period of inactivity — protects a walk-away session on
  // a shared front-desk or staffroom machine. Any interaction resets the timer.
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const reset = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        logAudit('session-timeout', currentUser.fullName, currentUser.username);
        setAuditActor('system');
        setCurrentUser(null);
      }, IDLE_TIMEOUT_MS);
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: currentUser !== null,
      currentUser, users, claims,
      login, logout,
      addUser, updateUser, setUserPassword, deleteUser,
      canAccess,
      fileClaim, resolveClaim, clearResolvedClaims,
      hasMasterCode, setMasterCode, verifyMasterCode,
      generateMasterCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
