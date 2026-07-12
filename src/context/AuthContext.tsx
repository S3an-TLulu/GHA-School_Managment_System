import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Cashier' | 'Teacher' | 'Viewer';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// Which sidebar sections each role can access. Admin sees everything.
export const ROLE_PERMISSIONS: Record<UserRole, string[] | 'all'> = {
  Admin: 'all',
  Cashier: ['dashboard', 'students', 'cashier', 'payments', 'bulkfees', 'expenses', 'statements', 'uniforms', 'debtors', 'transport', 'fundraisers', 'feestructure', 'reports', 'templates'],
  Teacher: ['dashboard', 'students', 'classes', 'attendance', 'results', 'timetable', 'calendar', 'events', 'announcements', 'requirements', 'reports'],
  Viewer: ['dashboard', 'calendar', 'events', 'announcements'],
};

const DEFAULT_USERS: AppUser[] = [
  { id: 'user-1', username: 'admin', password: 'admin123', fullName: 'Administrator', role: 'Admin' },
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

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  users: AppUser[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: AppUser) => void;
  updateUser: (id: string, user: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  canAccess: (sectionId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => { localStorage.setItem('gha_users', JSON.stringify(users)); }, [users]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addUser = (user: AppUser) => setUsers(prev => [...prev, user]);
  const updateUser = (id: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    setCurrentUser(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
  };
  const deleteUser = (id: string) => setUsers(prev => {
    // never delete the last remaining Admin
    const target = prev.find(u => u.id === id);
    if (target?.role === 'Admin' && prev.filter(u => u.role === 'Admin').length <= 1) return prev;
    return prev.filter(u => u.id !== id);
  });

  const canAccess = (sectionId: string): boolean => {
    if (!currentUser) return false;
    const perms = ROLE_PERMISSIONS[currentUser.role];
    return perms === 'all' || perms.includes(sectionId);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: currentUser !== null,
      currentUser, users,
      login, logout,
      addUser, updateUser, deleteUser,
      canAccess,
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
