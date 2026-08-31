import type { User, Company, AuthSession, UserRole } from '../types';
import api from '../utils/api';

const STORAGE_KEYS = {
  SESSION: 'agribiz_auth_session',
  USERS: 'agribiz_users',
  COMPANIES: 'agribiz_companies',
  ACCESS_TOKEN: 'agribiz_access_token',
  CURRENT_USER: 'agribiz_current_user',           // sessionStorage — cleared on tab close
  CURRENT_COMPANY: 'agribiz_current_company',      // localStorage  — persists across restarts
  REFRESH_TOKEN: 'agribiz_refresh_token',          // localStorage  — persists for auto-refresh
  STAFF_PIN_VERIFIED: 'agribiz_staff_pin_verified',// sessionStorage — strictly set only after correct PIN
  TAB_TOKEN: 'agribiz_tab_token',                  // sessionStorage — window.name bound tab token
};

// Initial Mock Seed Data for Instant 1-Click Demo Testing (used for local fallback)
const DEFAULT_COMPANY: Company = {
  id: 'COMP-101',
  businessName: 'AgriBiz Seeds & Implements Store',
  ownerName: 'Vaibhav Patel',
  mobile: '9425098765',
  email: 'contact@agribizstore.com',
  gstin: '23AAACA9876C1Z9',
  address: 'Shop No. 12-14, Krishi Mandi Complex, Mandi Area',
  city: 'Pipariya',
  state: 'Madhya Pradesh',
  logo: '',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-07-21T10:00:00Z',
  isActive: true,
  plan: 'Enterprise Business Suite',
  subscriptionStatus: 'Active',
  planExpiry: '2028-12-31T23:59:59Z',
};

const DEFAULT_USERS: User[] = [
  {
    id: 'USR-OWNER-01',
    companyId: 'COMP-101',
    name: 'Vaibhav Patel',
    mobile: '9425098765',
    email: 'vaibhav@agribizstore.com',
    password: 'owner123',
    role: 'Owner',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-07-21T10:00:00Z',
  },
];

class AuthService {
  private initStorage() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([DEFAULT_COMPANY]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
  }

  // Ensures new browser tabs require Staff PIN entry, preventing session inheritance bypass
  public initTabSession(): void {
    if (typeof window === 'undefined') return;

    const storedTabToken = sessionStorage.getItem(STORAGE_KEYS.TAB_TOKEN);
    const currentWindowName = window.name;

    // If window name is empty on OAuth return or refresh, restore tab token
    if (!currentWindowName && storedTabToken) {
      window.name = storedTabToken;
      return;
    }

    if (!currentWindowName || !storedTabToken || currentWindowName !== storedTabToken) {
      const newTabToken = 'tab_' + Math.random().toString(36).slice(2) + Date.now();
      window.name = newTabToken;
      sessionStorage.setItem(STORAGE_KEYS.TAB_TOKEN, newTabToken);

      // Only clear if no active login session exists
      const hasToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!hasToken) {
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem(STORAGE_KEYS.STAFF_PIN_VERIFIED);
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
  }

  constructor() {
    this.initStorage();
    this.initTabSession();
  }

  // --- Token Management ---

  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  public setAccessToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    window.dispatchEvent(new Event('agribiz_auth_change'));
    window.dispatchEvent(new CustomEvent('agribiz_tab_auth_change'));
  }

  // --- Session Management ---

  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    // Strict security check: User must have completed PIN verification in this tab
    const isPinVerified = sessionStorage.getItem(STORAGE_KEYS.STAFF_PIN_VERIFIED) === 'true';
    if (!isPinVerified) return null;

    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Company session lives strictly in tab-isolated sessionStorage
  public getCurrentCompany(): Company | null {
    if (typeof window === 'undefined') return null;
    const rawSession = sessionStorage.getItem(STORAGE_KEYS.CURRENT_COMPANY);
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession);
    } catch {
      return null;
    }
  }

  // --- Auth Actions ---

  public async login(
    mobile: string,
    password: string,
    role?: UserRole,
    _rememberMe: boolean = true
  ): Promise<{ success: boolean; message: string; user?: User; company?: Company }> {
    try {
      const response = await api.post('/auth/login', { mobile, password, role });
      const { success, message, accessToken, refreshToken, user, company } = response.data;

      if (success) {
        this.setAccessToken(accessToken);
        if (refreshToken) {
          sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        // Save company session in tab-isolated sessionStorage so tabs don't overwrite each other
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));

        // Save tab-isolated settings & branding for Staff PIN page
        const companySettings = {
          companyId: company.id,
          id: company.id,
          businessName: company.businessName,
          ownerName: company.ownerName,
          phone: company.mobile,
          email: company.email || '',
          gstin: company.gstin || '',
          city: company.city || '',
          state: company.state || '',
          address: `${company.city || ''}, ${company.state || ''}`.trim(),
          logo: company.logo || '',
        };
        sessionStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
        sessionStorage.setItem('agribiz_business_branding', JSON.stringify({
          businessId: company.id,
          logoUrl: company.logo || '',
          businessName: company.businessName,
        }));

        // Clear any stale global localStorage branding/settings to avoid cross-business bleeding
        try {
          localStorage.removeItem('agribiz_settings');
          localStorage.removeItem('agribiz_business_branding');
          localStorage.removeItem('agribiz_refresh_token');
          localStorage.removeItem('agribiz_current_company');
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('agribiz_tab_auth_change'));
        return { success: true, message, user, company };
      }

      return { success: false, message: message || 'Login failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials or connection error.';
      return { success: false, message };
    }
  }

  public async staffLogin(
    companyId: string,
    userId: string,
    pin: string
  ): Promise<{ success: boolean; message: string; user?: User; company?: Company }> {
    try {
      const response = await api.post('/auth/staff-login', { companyId, userId, pin });
      const { success, message, accessToken, refreshToken, user, company } = response.data;

      if (success) {
        this.setAccessToken(accessToken);
        if (refreshToken) {
          sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        // Staff session → sessionStorage only (forces PIN on each browser open / tab open)
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEYS.STAFF_PIN_VERIFIED, 'true');
        // Refresh company info in tab-isolated sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));

        const session: AuthSession = {
          currentUserId: user.id,
          companyId: user.companyId,
          token: accessToken,
          rememberMe: true,
        };
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

        return { success: true, message, user, company };
      }

      return { success: false, message: message || 'Staff login failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid PIN or connection error.';
      return { success: false, message };
    }
  }

  public async getActiveStaff(): Promise<User[]> {
    try {
      const res = await api.get('/users');
      if (res.data && res.data.success && Array.isArray(res.data.users)) {
        return res.data.users.filter((u: User) => u.status === 'Active');
      }
    } catch (err) {
      console.warn('Failed to fetch staff list from server:', err);
    }
    return this.getUsers().filter(u => u.status === 'Active');
  }

  public async registerCompany(
    companyInput: {
      businessName: string;
      ownerName: string;
      mobile: string;
      email?: string;
      gstin?: string;
      city?: string;
      state?: string;
    },
    ownerPassword: string,
    ownerPin: string
  ): Promise<{ success: boolean; message: string; user?: User; company?: Company; devVerificationLink?: string }> {
    try {
      const response = await api.post('/auth/register', {
        ...companyInput,
        password: ownerPassword,
        pin: ownerPin,
      });
      const { success, message, accessToken, refreshToken, user, company, devVerificationLink } = response.data;

      if (success) {
        this.setAccessToken(accessToken);
        if (refreshToken) {
          sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        // Staff/owner session in sessionStorage (forces PIN on restart / new tab)
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEYS.STAFF_PIN_VERIFIED, 'true');
        // Save company session in tab-isolated sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));

        // Save tab-isolated settings & branding for new company
        const companySettings = {
          companyId: company.id,
          id: company.id,
          businessName: company.businessName,
          ownerName: company.ownerName,
          phone: company.mobile,
          email: company.email || '',
          gstin: company.gstin || '',
          city: company.city || '',
          state: company.state || '',
          address: `${company.city || ''}, ${company.state || ''}`.trim(),
          logo: company.logo || '',
        };
        sessionStorage.setItem('agribiz_settings', JSON.stringify(companySettings));
        sessionStorage.setItem('agribiz_business_branding', JSON.stringify({
          businessId: company.id,
          logoUrl: company.logo || '',
          businessName: company.businessName,
        }));

        const session: AuthSession = {
          currentUserId: user.id,
          companyId: user.companyId,
          token: accessToken,
          rememberMe: true,
        };
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

        return { success: true, message, user, company, devVerificationLink };
      }

      return { success: false, message: message || 'Registration failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Try again.';
      return { success: false, message };
    }
  }

  public async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.setAccessToken(null);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.STAFF_PIN_VERIFIED);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.TAB_TOKEN);
      sessionStorage.removeItem('agribiz_settings');
      sessionStorage.removeItem('agribiz_business_branding');
      if (typeof window !== 'undefined') window.name = '';
      window.dispatchEvent(new CustomEvent('agribiz_tab_auth_change'));
    }
  }

  public async deleteBusinessAccount(confirmText: string, passwordOrPin: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/settings/company', {
        data: { confirmText, passwordOrPin },
      });

      if (response.data.success) {
        await this.purgeAllLocalClientState();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Account deletion failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete business account. Verification failed.';
      return { success: false, message };
    }
  }

  public async purgeAllLocalClientState(): Promise<void> {
    try {
      this.setAccessToken(null);
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('Error clearing caches:', e);
        }
      }
    } catch (e) {
      console.error('Error during client state purge:', e);
    }
  }

  // Only clears the staff session — keeps company session alive so next open goes to Staff Selection
  public logoutStaff(): void {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.STAFF_PIN_VERIFIED);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    this.setAccessToken(null);
  }

  public async refreshSession(): Promise<{ success: boolean; company?: Company; user?: User }> {
    try {
      const storedRefreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) return { success: false };
      const response = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
      const { success, accessToken, refreshToken: newRefreshToken, company, user } = response.data;

      if (success && accessToken) {
        this.setAccessToken(accessToken);
        if (newRefreshToken) {
          sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        }
        if (company) {
          sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));
        }
        if (user) {
          sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
        return { success: true, company, user };
      }
      return { success: false };
    } catch (error) {
      this.setAccessToken(null);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.STAFF_PIN_VERIFIED);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      return { success: false };
    }
  }

  public async resetPasswordByMobile(mobile: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/reset-password', {
        mobile,
        password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed.';
      return { success: false, message };
    }
  }

  // --- Local Database Queries (Staff User Management - seed/fallback for compatibility) ---

  public getUsers(): User[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return DEFAULT_USERS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  }

  public getCompanies(): Company[] {
    if (typeof window === 'undefined') return [DEFAULT_COMPANY];
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (!raw) return [DEFAULT_COMPANY];
    try {
      return JSON.parse(raw);
    } catch {
      return [DEFAULT_COMPANY];
    }
  }

  public getCompanyUsers(companyId: string): User[] {
    const users = this.getUsers().filter((u) => u.companyId === companyId);
    const uniqueMap = new Map<string, User>();
    users.forEach((u) => {
      uniqueMap.set(u.id, u);
    });
    return Array.from(uniqueMap.values());
  }

  public addUser(input: {
    companyId: string;
    name: string;
    mobile: string;
    password: string;
    role: UserRole;
    email?: string;
    customPermissions?: string[];
  }): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanMobile = input.mobile.replace(/\D/g, '');

    if (users.some((u) => (u.mobile || '').replace(/\D/g, '') === cleanMobile)) {
      return { success: false, message: 'User with this mobile number already exists.' };
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `USR-${input.role.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      companyId: input.companyId,
      name: input.name.trim(),
      mobile: cleanMobile,
      password: input.password,
      role: input.role,
      customPermissions: input.customPermissions,
      status: 'Active',
      email: input.email?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, message: `Staff user ${newUser.name} added successfully as ${newUser.role}!`, user: newUser };
  }

  public updateUser(user: User): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    user.updatedAt = new Date().toISOString();
    users[idx] = user;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  }

  public toggleUserStatus(userId: string): { success: boolean; newStatus?: 'Active' | 'Inactive'; message: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    user.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, newStatus: user.status, message: `User status updated to ${user.status}.` };
  }

  public resetUserPassword(userId: string, newPassword: string): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  }

  public async verifyEmail(token: string): Promise<{ success: boolean; message: string; email?: string }> {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to verify email. Please try again.',
      };
    }
  }

  public async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to resend verification email. Please try again.',
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
