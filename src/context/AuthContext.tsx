import React, { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword, generateMasterCode } from '../lib/auth';

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
  Cashier: ['dashboard', 'profile', 'students', 'cashier', 'payments', 'bulkfees', 'expenses', 'statements', 'uniforms', 'debtors', 'transport', 'fundraisers', 'kitchen', 'feestructure', 'reports', 'templates'],
  Teacher: ['dashboard', 'profile', 'students', 'classes', 'attendance', 'results', 'timetable', 'calendar', 'events', 'announcements', 'requirements', 'reports'],
  Viewer: ['dashboard', 'profile', 'calendar', 'events', 'announcements'],
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
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
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
          // fresh default admin — set the known default
          if (u.username === 'admin') { changed = true; return { ...u, password: await hashPassword('admin', 'admin123') }; }
          return u;
        }
        if (!isHashed(u.password)) { changed = true; return { ...u, password: await hashPassword(u.username, u.password) }; }
        return u;
      }));
      if (changed) setUsers(migrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    const key = usernameOrEmail.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === key || (u.email || '').toLowerCase() === key);
    if (!user) return false;
    const hash = await hashPassword(user.username, password);
    if (user.password !== hash) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addUser = async (user: Omit<AppUser, 'password'> & { password: string }) => {
    const hashed = await hashPassword(user.username, user.password);
    setUsers(prev => [...prev, { ...user, password: hashed }]);
  };

  const updateUser = (id: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    setCurrentUser(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
  };

  const setUserPassword = async (id: string, plainPassword: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const hashed = await hashPassword(user.username, plainPassword);
    updateUser(id, { password: hashed, mustReset: false });
  };

  const deleteUser = (id: string) => setUsers(prev => {
    const target = prev.find(u => u.id === id);
    if (target?.role === 'Admin' && prev.filter(u => u.role === 'Admin').length <= 1) return prev;
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
  };
  const verifyMasterCode = async (plainCode: string): Promise<boolean> => {
    const stored = localStorage.getItem('gha_master_code');
    if (!stored) return false;
    return stored === await hashPassword('__master__', plainCode);
  };

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
