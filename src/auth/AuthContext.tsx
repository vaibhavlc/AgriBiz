import { createContext, useContext } from 'react';
import type { User, Company, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  currentCompany: Company | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (mobile: string, password: string, rememberMe?: boolean) => { success: boolean; message: string };
  registerCompany: (companyData: any, ownerPassword: string) => { success: boolean; message: string };
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
