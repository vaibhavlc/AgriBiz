import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from './authService';
import { hasPermission as checkRolePermission } from './permissions';
import type { User, Company, UserRole } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => authService.getCurrentCompany());

  const refreshUser = () => {
    setCurrentUser(authService.getCurrentUser());
    setCurrentCompany(authService.getCurrentCompany());
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (mobile: string, password: string, rememberMe: boolean = true) => {
    const res = authService.login(mobile, password, rememberMe);
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    }
    return { success: res.success, message: res.message };
  };

  const registerCompany = (companyData: any, ownerPassword: string) => {
    const res = authService.registerCompany(companyData, ownerPassword);
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    }
    return { success: res.success, message: res.message };
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    return checkRolePermission(permission, currentUser.role, currentUser.customPermissions);
  };

  const role: UserRole | null = currentUser ? currentUser.role : null;
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        isAuthenticated,
        role,
        login,
        registerCompany,
        logout,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
