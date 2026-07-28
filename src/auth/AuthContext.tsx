import { createContext, useContext } from 'react';
import type { User, Company, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  currentCompany: Company | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (mobile: string, password: string, role?: UserRole, rememberMe?: boolean) => Promise<{ success: boolean; message: string; company?: Company }>;
  staffLogin: (companyId: string, userId: string, pin: string) => Promise<{ success: boolean; message: string; user?: User }>;
  registerCompany: (companyData: any, ownerPassword: string, ownerPin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  logoutStaff: () => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
  updateUserPresence: (presenceStatus: 'online' | 'busy' | 'away') => Promise<void>;
  updateCurrentUser: (fields: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
