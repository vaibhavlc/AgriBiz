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
      // Staff session is sessionStorage-only — cleared on restart, forces PIN re-entry
      setCurrentUser(null);
      // But company session persists in localStorage — keep it so staff selection is shown
      const savedCompany = authService.getCurrentCompany();
      if (savedCompany) setCurrentCompany(savedCompany);
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
    if (res.success && res.company) {
      setCurrentCompany(res.company);
      try {
        // Pre-fetch the latest staff list from the server into local database
        const { pullRemoteUpdates } = await import('../utils/syncEngine');
        await pullRemoteUpdates();
      } catch (err) {
        console.error('Failed to pull staff list during business login:', err);
      }
    }
    return { success: res.success, message: res.message, company: res.company };
  };

  const staffLogin = async (companyId: string, userId: string, pin: string) => {
    const res = await authService.staffLogin(companyId, userId, pin);
    if (res.success && res.user && res.company) {
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
    }
    return { success: res.success, message: res.message, user: res.user };
  };

  const registerCompany = async (companyData: any, ownerPassword: string, ownerPin: string) => {
    const res = await authService.registerCompany(companyData, ownerPassword, ownerPin);
    if (res.success && res.company) {
      setCurrentCompany(res.company);
      // Auto-login the owner right after registration — no need to go back to login
      if (res.user) {
        setCurrentUser(res.user);
      }
      try {
        const { pullRemoteUpdates } = await import('../utils/syncEngine');
        await pullRemoteUpdates();
      } catch (err) {
        console.error('Failed to pull staff list during registration:', err);
      }
    }
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  const logoutStaff = () => {
    authService.logoutStaff();
    setCurrentUser(null);
    // Keep currentCompany alive — so next open skips business login and goes to Staff Selection
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
        staffLogin,
        registerCompany,
        logout,
        logoutStaff,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
