import type { User, Company, AuthSession, UserRole } from '../types';

const STORAGE_KEYS = {
  SESSION: 'agribiz_auth_session',
  USERS: 'agribiz_users',
  COMPANIES: 'agribiz_companies',
};

// Initial Mock Seed Data for Instant 1-Click Demo Testing
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
  {
    id: 'USR-ACCT-02',
    companyId: 'COMP-101',
    name: 'Ramesh Sharma',
    mobile: '9876543210',
    email: 'ramesh.accounts@agribizstore.com',
    password: 'accounts123',
    role: 'Accounts',
    status: 'Active',
    avatar: '',
    lastLogin: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-07-21T10:00:00Z',
  },
  {
    id: 'USR-CASH-03',
    companyId: 'COMP-101',
    name: 'Suresh Verma',
    mobile: '9123456789',
    email: 'suresh.cashier@agribizstore.com',
    password: 'cashier123',
    role: 'Cashier',
    status: 'Active',
    avatar: '',
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: '2026-03-01T10:00:00Z',
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

  // --- Session Management ---

  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public getCurrentUser(): User | null {
    const session = this.getSession();
    if (!session) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === session.currentUserId && u.status === 'Active') || null;
  }

  public getCurrentCompany(): Company | null {
    const session = this.getSession();
    if (!session) return null;
    const companies = this.getCompanies();
    return companies.find((c) => c.id === session.companyId && c.isActive) || null;
  }

  // --- Auth Actions ---

  public login(mobile: string, password: string, rememberMe: boolean = true): { success: boolean; message: string; user?: User; company?: Company } {
    this.initStorage();
    const cleanMobile = mobile.replace(/\D/g, '');
    const users = this.getUsers();

    const user = users.find((u) => u.mobile.replace(/\D/g, '') === cleanMobile);

    if (!user) {
      return { success: false, message: 'No account found with this mobile number. Please register your business.' };
    }

    if (user.status === 'Inactive') {
      return { success: false, message: 'Your user account has been disabled by the business Owner.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, message: 'Invalid password. Please check your credentials and try again.' };
    }

    const company = this.getCompanies().find((c) => c.id === user.companyId);
    if (!company || !company.isActive) {
      return { success: false, message: 'Your business account is suspended or inactive.' };
    }

    // Update lastLogin timestamp
    const now = new Date().toISOString();
    user.lastLogin = now;
    this.updateUser(user);

    // Save Session Token
    const mockToken = `eyAgribizJWTToken_${user.id}_${Date.now()}`;
    const session: AuthSession = {
      currentUserId: user.id,
      companyId: user.companyId,
      token: mockToken,
      rememberMe,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
      company,
    };
  }

  public registerCompany(companyInput: {
    businessName: string;
    ownerName: string;
    mobile: string;
    email?: string;
    gstin?: string;
    city?: string;
    state?: string;
  }, ownerPassword: string): { success: boolean; message: string; user?: User; company?: Company } {
    this.initStorage();
    const cleanMobile = companyInput.mobile.replace(/\D/g, '');
    const users = this.getUsers();

    if (users.some((u) => u.mobile.replace(/\D/g, '') === cleanMobile)) {
      return { success: false, message: 'A user account with this mobile number already exists. Please login instead.' };
    }

    const companyId = `COMP-${Date.now().toString().slice(-5)}`;
    const ownerId = `USR-OWNER-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newCompany: Company = {
      id: companyId,
      businessName: companyInput.businessName.trim(),
      ownerName: companyInput.ownerName.trim(),
      mobile: cleanMobile,
      email: companyInput.email?.trim() || '',
      gstin: companyInput.gstin?.trim() || '',
      city: companyInput.city?.trim() || 'Pipariya',
      state: companyInput.state?.trim() || 'Madhya Pradesh',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      plan: 'Enterprise Business Suite',
      subscriptionStatus: 'Active',
    };

    const newOwner: User = {
      id: ownerId,
      companyId,
      name: companyInput.ownerName.trim(),
      mobile: cleanMobile,
      email: companyInput.email?.trim() || '',
      password: ownerPassword,
      role: 'Owner',
      status: 'Active',
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
    };

    const companies = this.getCompanies();
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));

    users.push(newOwner);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Auto-login Owner
    const session: AuthSession = {
      currentUserId: ownerId,
      companyId,
      token: `eyAgribizJWTToken_${ownerId}_${Date.now()}`,
      rememberMe: true,
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    return {
      success: true,
      message: 'Business registered successfully! Logged in as Owner.',
      user: newOwner,
      company: newCompany,
    };
  }

  public logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  // --- Data Queries ---

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

  // --- Owner User Management ---

  public addUser(input: { companyId: string; name: string; mobile: string; password: string; role: UserRole; email?: string; customPermissions?: string[] }): { success: boolean; message: string; user?: User } {
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

  public resetPasswordByMobile(mobile: string, newPassword: string): { success: boolean; message: string } {
    const cleanMobile = mobile.replace(/\D/g, '');
    const users = this.getUsers();
    const user = users.find((u) => u.mobile.replace(/\D/g, '') === cleanMobile);

    if (!user) {
      return { success: false, message: 'No account registered with this mobile number.' };
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, message: 'Password reset successfully! You can now log in.' };
  }
}

export const authService = new AuthService();
