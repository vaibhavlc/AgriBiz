import type { User, Company, AuthSession, UserRole } from '../types';
import api from '../utils/api';

const STORAGE_KEYS = {
  SESSION: 'agribiz_auth_session',
  USERS: 'agribiz_users',
  COMPANIES: 'agribiz_companies',
  ACCESS_TOKEN: 'agribiz_access_token',
  CURRENT_USER: 'agribiz_current_user',
  CURRENT_COMPANY: 'agribiz_current_company',
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

  constructor() {
    this.initStorage();
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
    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public getCurrentCompany(): Company | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_COMPANY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // --- Auth Actions ---

  public async login(
    mobile: string,
    password: string,
    role?: UserRole,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; message: string; user?: User; company?: Company }> {
    try {
      const response = await api.post('/auth/login', { mobile, password, role });
      const { success, message, accessToken, refreshToken, user, company } = response.data;

      if (success) {
        this.setAccessToken(accessToken);
        if (refreshToken) {
          sessionStorage.setItem('agribiz_refresh_token', refreshToken);
        }
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));

        // Create standard mock session for other parts of the app
        const session: AuthSession = {
          currentUserId: user.id,
          companyId: user.companyId,
          token: accessToken,
          rememberMe,
        };
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

        return { success: true, message, user, company };
      }

      return { success: false, message: message || 'Login failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials or connection error.';
      return { success: false, message };
    }
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
    ownerPassword: string
  ): Promise<{ success: boolean; message: string; user?: User; company?: Company }> {
    try {
      const response = await api.post('/auth/register', {
        ...companyInput,
        password: ownerPassword,
      });
      const { success, message, accessToken, refreshToken, user, company } = response.data;

      if (success) {
        this.setAccessToken(accessToken);
        if (refreshToken) {
          sessionStorage.setItem('agribiz_refresh_token', refreshToken);
        }
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
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
      sessionStorage.removeItem('agribiz_refresh_token');
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  public async refreshSession(): Promise<{ success: boolean; user?: User; company?: Company }> {
    try {
      const storedRefreshToken = sessionStorage.getItem('agribiz_refresh_token');
      const response = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
      const { success, accessToken, refreshToken: newRefreshToken, user, company } = response.data;

      if (success && accessToken) {
        this.setAccessToken(accessToken);
        if (newRefreshToken) {
          sessionStorage.setItem('agribiz_refresh_token', newRefreshToken);
        }
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, JSON.stringify(company));

        const session = this.getSession();
        if (session) {
          session.token = accessToken;
          sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        }

        return { success: true, user, company };
      }
      return { success: false };
    } catch (error) {
      this.setAccessToken(null);
      sessionStorage.removeItem('agribiz_refresh_token');
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY);
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

    if (users.some((u) => u.mobile.replace(/\D/g, '') === cleanMobile)) {
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
}

export const authService = new AuthService();
export default authService;
