import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from './authService';
import { hasPermission as checkRolePermission } from './permissions';
import { initializeSocket, disconnectSocket } from '../utils/socketService';
import type { User, Company, UserRole } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => authService.getCurrentCompany());

  const refreshUser = async () => {
    const res = await authService.refreshSession();
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    } else {
      setCurrentUser(authService.getCurrentUser());
      setCurrentCompany(authService.getCurrentCompany());
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      initializeSocket();
    } else {
      disconnectSocket();
    }
  }, [currentUser]);

  const login = async (mobile: string, password: string, role?: UserRole, rememberMe: boolean = true) => {
    const res = await authService.login(mobile, password, role, rememberMe);
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    }
    return { success: res.success, message: res.message };
  };

  const registerCompany = async (companyData: any, ownerPassword: string) => {
    const res = await authService.registerCompany(companyData, ownerPassword);
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    }
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    await authService.logout();
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
