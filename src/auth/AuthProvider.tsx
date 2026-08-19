import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from './authService';
import { hasPermission as checkRolePermission } from './permissions';
import api from '../utils/api';
import { initialSettings } from '../utils/dummyData';
import type { User, Company, UserRole } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => authService.getCurrentCompany());
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const savedCompany = authService.getCurrentCompany();
      if (savedCompany) {
        setCurrentCompany(savedCompany);
      }
      const savedUser = authService.getCurrentUser();
      const res = await authService.refreshSession();
      if (res.success && res.company) {
        setCurrentCompany(res.company);
      }
      // Maintain active staff session on browser refresh if sessionStorage user exists
      if (savedUser) {
        setCurrentUser(savedUser);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Session restoration check warning:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const updateUserPresence = async (presenceStatus: 'online' | 'busy' | 'away') => {
    if (!currentUser) return;
    const updated = { ...currentUser, presenceStatus };
    setCurrentUser(updated);
    sessionStorage.setItem('agribiz_current_user', JSON.stringify(updated));

    // Dispatch local staff-presence-changed event
    window.dispatchEvent(new CustomEvent('staff-presence-changed', {
      detail: { userId: currentUser.id, presenceStatus, record: updated }
    }));

    try {
      await api.put('/users/presence', { presenceStatus });
    } catch (err) {
      console.error('Failed to update presence status with server:', err);
    }
  };

  const updateCurrentUser = (fields: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      sessionStorage.setItem('agribiz_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async (mobile: string, password: string, role?: UserRole, rememberMe: boolean = true) => {
    const res = await authService.login(mobile, password, role, rememberMe);
    if (res.success && res.company) {
      setCurrentCompany(res.company);
      const companySettings = {
        ...initialSettings,
        id: 'business',
        businessName: res.company.businessName,
        ownerName: res.company.ownerName,
        logo: res.company.logo || '',
        phone: res.company.mobile,
        email: res.company.email || '',
        gstin: res.company.gstin || '',
        city: res.company.city || '',
        state: res.company.state || '',
        address: `${res.company.city || ''}, ${res.company.state || ''}`.trim(),
      };
      localStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
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
      if (res.user) {
        setCurrentUser(res.user);
      }
      const companySettings = {
        ...initialSettings,
        id: 'business',
        businessName: res.company.businessName,
        ownerName: res.company.ownerName,
        phone: res.company.mobile,
        email: res.company.email || '',
        gstin: res.company.gstin || '',
        city: res.company.city || '',
        state: res.company.state || '',
        address: `${res.company.city || ''}, ${res.company.state || ''}`.trim(),
      };
      localStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
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
        isInitializing,
        role,
        login,
        staffLogin,
        registerCompany,
        logout,
        logoutStaff,
        hasPermission,
        refreshUser,
        updateUserPresence,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
