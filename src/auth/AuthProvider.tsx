import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from './authService';
import { hasPermission as checkRolePermission } from './permissions';
import { initializeSocket, disconnectSocket } from '../utils/socketService';
import api from '../utils/api';
import { db } from '../db/db';
import { initialSettings } from '../utils/dummyData';
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

  // Global socket listener for staff presence changes
  useEffect(() => {
    const handlePresenceChanged = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail && currentUser && detail.userId === currentUser.id) {
        setCurrentUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, presenceStatus: detail.presenceStatus as any };
          sessionStorage.setItem('agribiz_current_user', JSON.stringify(updated));
          return updated;
        });
      }
    };
    window.addEventListener('staff-presence-changed' as any, handlePresenceChanged as any);
    return () => {
      window.removeEventListener('staff-presence-changed' as any, handlePresenceChanged as any);
    };
  }, [currentUser?.id]);

  const updateUserPresence = async (presenceStatus: 'online' | 'busy' | 'away') => {
    if (!currentUser) return;
    const updated = { ...currentUser, presenceStatus };
    setCurrentUser(updated);
    sessionStorage.setItem('agribiz_current_user', JSON.stringify(updated));
    try {
      await api.put('/users/presence', { presenceStatus });
    } catch (err) {
      console.error('Failed to sync presence status with server:', err);
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
      try {
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
        const existingSettings = await db.settings.get('business');
        if (!existingSettings || !existingSettings.businessName) {
          await db.settings.put(companySettings);
          localStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
        }
      } catch (e) {
        console.warn('Failed to populate local settings during login:', e);
      }
      try {
        // Pre-fetch the latest staff list from the server into local database
        const { pullRemoteUpdates } = await import('../utils/syncEngine');
        await pullRemoteUpdates();
      } catch (err) {
        console.error('Failed to pull staff list during business login:', err);
      }
      window.dispatchEvent(new CustomEvent('sync-completed'));
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
        await db.settings.put(companySettings);
        localStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
      } catch (e) {
        console.warn('Failed to save settings locally during registration:', e);
      }
      try {
        const { pullRemoteUpdates } = await import('../utils/syncEngine');
        await pullRemoteUpdates();
      } catch (err) {
        console.error('Failed to pull staff list during registration:', err);
      }
      window.dispatchEvent(new CustomEvent('sync-completed'));
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
        updateUserPresence,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
