import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Product, Customer, Supplier, Invoice, Purchase, Payment, BusinessSettings, Expense, Quotation, RecycleBinItem } from '../types';
import {
  initialSettings,
  toTitleCase,
} from '../utils/dummyData';
import api, { setApiSocketId, getRawBaseHost } from '../utils/api';
import { io, Socket } from 'socket.io-client';

interface AppContextType {
  recycleBin: RecycleBinItem[];
  restoreRecord: (id: string) => void;
  deletePermanently: (id: string) => void;
  restoreRecords: (ids: string[]) => void;
  deleteRecordsPermanently: (ids: string[]) => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  quotations: Quotation[];
  purchases: Purchase[];
  payments: Payment[];
  settings: BusinessSettings;
  activeTheme: 'light' | 'dark';
  currentTab: string;
  currentInvoiceId: string | null;
  currentQuotationId: string | null;
  currentPurchaseId: string | null;
  currentCustomerId: string | null;
  currentSupplierId: string | null;
  isCreatingInvoice: boolean;
  isCreatingQuotation: boolean;
  isEnteringPurchase: boolean;
  isEditingProduct: Product | null;
  isEditingCustomer: Customer | null;
  isEditingSupplier: Supplier | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  isFormDirty: boolean;
  setFormDirty: (formId: string, isDirty: boolean) => void;
  clearAllDirtyForms: () => void;
  requestNavigation: (callback: () => void) => void;
  showUnsavedModal: boolean;
  setShowUnsavedModal: (show: boolean) => void;
  confirmLeave: () => void;
  confirmStay: () => void;

  setCurrentTab: (tab: string, force?: boolean) => void;
  setViewInvoice: (id: string | null, force?: boolean) => void;
  setViewQuotation: (id: string | null, force?: boolean) => void;
  setViewPurchase: (id: string | null, force?: boolean) => void;
  setViewCustomer: (id: string | null, force?: boolean) => void;
  setViewSupplier: (id: string | null, force?: boolean) => void;
  setIsCreatingInvoice: (val: boolean, force?: boolean) => void;
  setIsCreatingQuotation: (val: boolean, force?: boolean) => void;
  setIsEnteringPurchase: (val: boolean, force?: boolean) => void;
  setIsEditingProduct: (product: Product | null, force?: boolean) => void;
  setIsEditingCustomer: (customer: Customer | null, force?: boolean) => void;
  setIsEditingSupplier: (supplier: Supplier | null, force?: boolean) => void;
  navigateTab: (tab: string) => void;

  salesActiveTab: 'invoices' | 'quotations';
  setSalesActiveTab: (tab: 'invoices' | 'quotations') => void;

  addProduct: (product: Omit<Product, 'id'>) => Promise<Product | null>;
  editProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => Promise<Customer | null>;
  editCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => Promise<Supplier | null>;
  editSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<Invoice | null>;
  editInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber'>) => Promise<Quotation | null>;
  editQuotation: (quotation: Quotation) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToInvoice: (quotationId: string, amountPaid: number, paymentMethod: string) => Promise<string | null>;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNumber'>) => Promise<Purchase | null>;
  editPurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id'>) => void;
  editPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;

  updateSettings: (settings: BusinessSettings) => void;
  resetToDefault: () => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
  editExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  paymentFormPreset: { contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' } | null;
  setPaymentFormPreset: (preset: { contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' } | null) => void;
  salesFormPresetCustomerId: string | null;
  setSalesFormPresetCustomerId: (id: string | null) => void;
  purchaseFormPresetSupplierId: string | null;
  setPurchaseFormPresetSupplierId: (id: string | null) => void;

  isPaymentFormOpen: boolean;
  setIsPaymentFormOpen: (val: boolean) => void;
  paymentType: 'CustomerReceipt' | 'SupplierPayment';
  setPaymentType: (type: 'CustomerReceipt' | 'SupplierPayment') => void;
  contactId: string;
  setContactId: (id: string) => void;
  paymentDate: string;
  setPaymentDate: (date: string) => void;
  amount: number;
  setAmount: (amount: number) => void;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  setPaymentMethod: (method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque') => void;
  referenceNumber: string;
  setReferenceNumber: (ref: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  editingPaymentId: string | null;
  setEditingPaymentId: (id: string | null) => void;
  openNewPaymentForm: (preset?: { contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' }) => void;
  openEditPaymentForm: (payment: Payment) => void;
  handleSavePayment: (e: React.FormEvent) => void;

  isOnline: boolean;
  reloadData: () => Promise<void>;
  synchronize: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to generate prefix-date-random IDs
const generateId = (prefix: string) => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
};

export interface BusinessBrandingCache {
  businessId?: string;
  logoUrl: string;
  watermarkLogoUrl: string;
  logoVersion: number;
  businessName: string;
}

const BRANDING_CACHE_KEY = 'agribiz_business_branding';

const getCachedBranding = (): Partial<BusinessBrandingCache> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to parse branding cache:', e);
  }
  return null;
};

const setCachedBranding = (branding: { logoUrl: string; watermarkLogoUrl: string; businessName: string; businessId?: string }) => {
  if (typeof window === 'undefined') return;
  try {
    const cacheObj: BusinessBrandingCache = {
      businessId: branding.businessId || 'company_1',
      logoUrl: branding.logoUrl || '',
      watermarkLogoUrl: branding.watermarkLogoUrl || '',
      logoVersion: Date.now(),
      businessName: branding.businessName || 'AgriBiz',
    };
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    console.error('Failed to save branding cache:', e);
  }
};

const REALTIME_CHANNEL_NAME = 'agribiz_realtime_updates';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(REALTIME_CHANNEL_NAME) : null;

export const notifyMutation = () => {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'MUTATION_OCCURRED', timestamp: Date.now() });
    } catch (e) {}
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-Memory state updated directly from REST APIs
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);

  // Small settings & theme managed in localStorage + Stale-While-Revalidate Branding Cache
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const local = localStorage.getItem('agribiz_settings');
    const raw = local ? { ...initialSettings, ...JSON.parse(local) } : initialSettings;
    const cachedBranding = getCachedBranding();
    
    const logo = raw.logo !== undefined ? raw.logo : (cachedBranding?.logoUrl || '');
    const watermarkLogo = raw.watermarkLogo !== undefined ? raw.watermarkLogo : (cachedBranding?.watermarkLogoUrl || '');
    const businessName = toTitleCase(cachedBranding?.businessName || raw.businessName);

    return {
      ...raw,
      logo,
      watermarkLogo,
      businessName,
      ownerName: toTitleCase(raw.ownerName),
    };
  });

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agribiz_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.theme === 'dark') return 'dark';
          if (parsed.theme === 'light') return 'light';
        } catch (e) {}
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (settings.theme === 'dark') {
      setActiveTheme('dark');
    } else if (settings.theme === 'light') {
      setActiveTheme('light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setActiveTheme(isDark ? 'dark' : 'light');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (activeTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [activeTheme]);

  // Online / Offline Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateTargetModuleState = (module: string, action: string, recordId: string | null, rawRecord: any) => {
    const recId = recordId || rawRecord?.id || rawRecord?.productId || rawRecord?.customerId || rawRecord?.supplierId || rawRecord?.invoiceId || rawRecord?.purchaseId || rawRecord?.expenseId || rawRecord?.paymentId || rawRecord?.quotationId;

    switch (module) {
      case 'Invoices': {
        if (action === 'DELETE' && recId) {
          setInvoices(prev => prev.filter(i => i.id !== recId && (i as any).invoiceId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.invoiceId || rawRecord.id };
          setInvoices(prev => [item, ...prev.filter(i => i.id !== item.id && (i as any).invoiceId !== item.id)]);
        }
        break;
      }
      case 'Expenses': {
        if (action === 'DELETE' && recId) {
          setExpenses(prev => prev.filter(e => e.id !== recId && (e as any).expenseId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.expenseId || rawRecord.id };
          setExpenses(prev => [item, ...prev.filter(e => e.id !== item.id && (e as any).expenseId !== item.id)]);
        }
        break;
      }
      case 'Purchases': {
        if (action === 'DELETE' && recId) {
          setPurchases(prev => prev.filter(p => p.id !== recId && (p as any).purchaseId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.purchaseId || rawRecord.id };
          setPurchases(prev => [item, ...prev.filter(p => p.id !== item.id && (p as any).purchaseId !== item.id)]);
        }
        break;
      }
      case 'Products': {
        if (action === 'DELETE' && recId) {
          setProducts(prev => prev.filter(p => p.id !== recId && (p as any).productId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.productId || rawRecord.id };
          setProducts(prev => [item, ...prev.filter(p => p.id !== item.id && (p as any).productId !== item.id)]);
        }
        break;
      }
      case 'Customers': {
        if (action === 'DELETE' && recId) {
          setCustomers(prev => prev.filter(c => c.id !== recId && (c as any).customerId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.customerId || rawRecord.id };
          setCustomers(prev => [item, ...prev.filter(c => c.id !== item.id && (c as any).customerId !== item.id)]);
        }
        break;
      }
      case 'Suppliers': {
        if (action === 'DELETE' && recId) {
          setSuppliers(prev => prev.filter(s => s.id !== recId && (s as any).supplierId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.supplierId || rawRecord.id };
          setSuppliers(prev => [item, ...prev.filter(s => s.id !== item.id && (s as any).supplierId !== item.id)]);
        }
        break;
      }
      case 'Payments': {
        if (action === 'DELETE' && recId) {
          setPayments(prev => prev.filter(p => p.id !== recId && (p as any).paymentId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.paymentId || rawRecord.id };
          setPayments(prev => [item, ...prev.filter(p => p.id !== item.id && (p as any).paymentId !== item.id)]);
        }
        break;
      }
      case 'Quotations': {
        if (action === 'DELETE' && recId) {
          setQuotations(prev => prev.filter(q => q.id !== recId && (q as any).quotationId !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.quotationId || rawRecord.id };
          setQuotations(prev => [item, ...prev.filter(q => q.id !== item.id && (q as any).quotationId !== item.id)]);
        }
        break;
      }
      case 'Settings': {
        if (rawRecord) {
          setSettings(prev => ({ ...prev, ...rawRecord }));
        }
        break;
      }
      case 'RecycleBin': {
        if (action === 'DELETE' && recId) {
          setRecycleBin(prev => prev.filter(r => r.id !== recId));
        } else if (rawRecord) {
          const item = { ...rawRecord, id: rawRecord.id || rawRecord._id };
          setRecycleBin(prev => [item, ...prev.filter(r => r.id !== item.id)]);
        }
        break;
      }
      default: {
        reloadData();
        break;
      }
    }
  };

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const setupSocket = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setApiSocketId(null);
      }

      const token = sessionStorage.getItem('agribiz_access_token');
      if (!token) return;

      const getSocketURL = () => {
        const host = getRawBaseHost();
        if (host) return host;
        return window.location.origin;
      };

      const socketUrl = getSocketURL();
      console.log('[SOCKET] Connecting to Socket.IO server at:', socketUrl);

      const socket = io(socketUrl, {
        auth: (cb: (data: object) => void) => {
          cb({ token: sessionStorage.getItem('agribiz_access_token') });
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log(`[SOCKET] Connected: ${socket.id}`);
        setApiSocketId(socket.id || null);
        reloadData();
      });

      socket.on('disconnect', (reason) => {
        console.log(`[SOCKET] Disconnected: ${socket.id} | Reason: ${reason}`);
        setApiSocketId(null);
      });

      socket.on('connect_error', (err) => {
        console.warn('[SOCKET] Connection error:', err.message);
        if (err.message?.includes('Authentication') || err.message?.includes('token')) {
          api.get('/settings').catch(() => {});
        }
      });

      socket.on('data_change', (event: any) => {
        const T3 = performance.now();
        console.log('[REMOTE SOCKET] data_change received:', event);

        if (event.senderSocketId && event.senderSocketId === socket.id) {
          console.log(`[SOCKET] Ignoring self-initiated mutation event (socketId: ${socket.id})`);
          return;
        }

        const { module, action, recordId, record } = event;

        if (record || (action === 'DELETE' && recordId)) {
          updateTargetModuleState(module, action, recordId, record);
          const T4 = performance.now();
          console.log(`[PERF] T3 -> T4 (Socket event -> React state update): ${(T4 - T3).toFixed(2)} ms`);

          queueMicrotask(() => {
            const T5 = performance.now();
            console.log(`[PERF] T4 -> T5 (React state update -> Visible UI render): ${(T5 - T4).toFixed(2)} ms`);
            console.log(`[PERF] TOTAL Application Processing Latency (T3 -> T5): ${(T5 - T3).toFixed(2)} ms`);
          });
        } else {
          reloadData();
        }
      });
    };

    setupSocket();

    window.addEventListener('agribiz_auth_change', setupSocket);

    const handleFocus = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        reloadData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setApiSocketId(null);
      }
      window.removeEventListener('agribiz_auth_change', setupSocket);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const reloadData = async () => {
    if (!navigator.onLine) {
      console.warn('System is offline. Skipping REST API reloadData.');
      return;
    }
    const t = Date.now();
    try {
      const [
        productsRes,
        customersRes,
        suppliersRes,
        invoicesRes,
        quotationsRes,
        purchasesRes,
        paymentsRes,
        expensesRes,
        recycleBinRes,
        settingsRes
      ] = await Promise.allSettled([
        api.get(`/products?_t=${t}`),
        api.get(`/customers?_t=${t}`),
        api.get(`/suppliers?_t=${t}`),
        api.get(`/invoices?_t=${t}`),
        api.get(`/quotations?_t=${t}`),
        api.get(`/purchases?_t=${t}`),
        api.get(`/payments?_t=${t}`),
        api.get(`/expenses?_t=${t}`),
        api.get(`/recycle-bin?_t=${t}`),
        api.get(`/settings?_t=${t}`),
      ]);

      if (productsRes.status === 'fulfilled' && productsRes.value.data?.products) {
        setProducts(productsRes.value.data.products.map((p: any) => ({ ...p, id: p.productId || p.id })));
      }
      if (customersRes.status === 'fulfilled' && customersRes.value.data?.customers) {
        setCustomers(customersRes.value.data.customers.map((c: any) => ({ ...c, id: c.customerId || c.id })));
      }
      if (suppliersRes.status === 'fulfilled' && suppliersRes.value.data?.suppliers) {
        setSuppliers(suppliersRes.value.data.suppliers.map((s: any) => ({ ...s, id: s.supplierId || s.id })));
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data?.invoices) {
        setInvoices(invoicesRes.value.data.invoices.map((i: any) => ({ ...i, id: i.invoiceId || i.id })));
      }
      if (quotationsRes.status === 'fulfilled' && quotationsRes.value.data?.quotations) {
        setQuotations(quotationsRes.value.data.quotations.map((q: any) => ({ ...q, id: q.quotationId || q.id })));
      }
      if (purchasesRes.status === 'fulfilled' && purchasesRes.value.data?.purchases) {
        setPurchases(purchasesRes.value.data.purchases.map((p: any) => ({ ...p, id: p.purchaseId || p.id })));
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data?.payments) {
        setPayments(paymentsRes.value.data.payments.map((p: any) => ({ ...p, id: p.paymentId || p.id })));
      }
      if (expensesRes.status === 'fulfilled' && expensesRes.value.data?.expenses) {
        setExpenses(expensesRes.value.data.expenses.map((e: any) => ({ ...e, id: e.expenseId || e.id })));
      }
      if (recycleBinRes.status === 'fulfilled' && recycleBinRes.value.data?.items) {
        setRecycleBin(recycleBinRes.value.data.items);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.settings) {
        const remoteSettings: BusinessSettings = settingsRes.value.data.settings;
        setSettings((prev) => {
          const updatedLogo = remoteSettings.logo !== undefined ? remoteSettings.logo : (prev.logo || '');
          const updatedWatermark = remoteSettings.watermarkLogo !== undefined ? remoteSettings.watermarkLogo : (prev.watermarkLogo || '');
          const updatedName = toTitleCase(remoteSettings.businessName || prev.businessName);

          const updatedSettings = {
            ...remoteSettings,
            logo: updatedLogo,
            watermarkLogo: updatedWatermark,
            businessName: updatedName,
          };

          // Save to localStorage for instant stale-while-revalidate on next boot
          localStorage.setItem('agribiz_settings', JSON.stringify(updatedSettings));
          setCachedBranding({
            logoUrl: updatedLogo,
            watermarkLogoUrl: updatedWatermark,
            businessName: updatedName,
            businessId: (remoteSettings as any).companyId,
          });

          return updatedSettings;
        });
      }
    } catch (err) {
      console.error('Failed to load data from REST API:', err);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Unsaved Changes Protection State & Logic
  const [dirtyForms, setDirtyForms] = useState<Record<string, boolean>>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingCallbacksRef = useRef<(() => void)[]>([]);

  const isFormDirty = Object.values(dirtyForms).some(Boolean);

  const setFormDirty = (formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => {
      if (prev[formId] === isDirty) return prev;
      return { ...prev, [formId]: isDirty };
    });
  };

  const clearAllDirtyForms = () => {
    setDirtyForms({});
  };

  const confirmStay = () => {
    setShowUnsavedModal(false);
    pendingCallbacksRef.current = [];
  };

  const confirmLeave = () => {
    setDirtyForms({});
    setShowUnsavedModal(false);
    pendingCallbacksRef.current.forEach((cb) => cb());
    pendingCallbacksRef.current = [];
  };

  const requestNavigation = (callback: () => void) => {
    if (Object.values(dirtyForms).some(Boolean)) {
      pendingCallbacksRef.current.push(callback);
      setShowUnsavedModal(true);
    } else {
      callback();
    }
  };

  // UI State
  const [currentTab, _setCurrentTab] = useState<string>(() => window.location.hash.slice(1) || 'dashboard');
  const [currentInvoiceId, _setViewInvoice] = useState<string | null>(null);
  const [currentQuotationId, _setViewQuotation] = useState<string | null>(null);
  const [currentPurchaseId, _setViewPurchase] = useState<string | null>(null);
  const [currentCustomerId, _setViewCustomer] = useState<string | null>(null);
  const [currentSupplierId, _setViewSupplier] = useState<string | null>(null);
  const [isCreatingInvoice, _setIsCreatingInvoice] = useState<boolean>(false);
  const [isCreatingQuotation, _setIsCreatingQuotation] = useState<boolean>(false);
  const [isEnteringPurchase, _setIsEnteringPurchase] = useState<boolean>(false);
  const [isEditingProduct, _setIsEditingProduct] = useState<Product | null>(null);
  const [isEditingCustomer, _setIsEditingCustomer] = useState<Customer | null>(null);
  const [isEditingSupplier, _setIsEditingSupplier] = useState<Supplier | null>(null);

  const setCurrentTab = (tab: string, force = false) => force ? (_setCurrentTab(tab), window.history.pushState({ tab }, '', '#' + tab)) : requestNavigation(() => { window.history.pushState({ tab }, '', '#' + tab); _setCurrentTab(tab); });
  const setViewInvoice = (id: string | null, force = false) => {
    if (force) {
      clearAllDirtyForms();
      if (id !== null) {
        _setIsCreatingInvoice(false);
        _setIsCreatingQuotation(false);
      }
      _setViewInvoice(id);
    } else {
      requestNavigation(() => {
        if (id !== null) {
          _setIsCreatingInvoice(false);
          _setIsCreatingQuotation(false);
        }
        _setViewInvoice(id);
      });
    }
  };

  const setViewQuotation = (id: string | null, force = false) => {
    if (force) {
      clearAllDirtyForms();
      if (id !== null) {
        _setIsCreatingQuotation(false);
        _setIsCreatingInvoice(false);
      }
      _setViewQuotation(id);
    } else {
      requestNavigation(() => {
        if (id !== null) {
          _setIsCreatingQuotation(false);
          _setIsCreatingInvoice(false);
        }
        _setViewQuotation(id);
      });
    }
  };

  const setViewPurchase = (id: string | null, force = false) => {
    if (force) {
      clearAllDirtyForms();
      if (id !== null) {
        _setIsEnteringPurchase(false);
      }
      _setViewPurchase(id);
    } else {
      requestNavigation(() => {
        if (id !== null) {
          _setIsEnteringPurchase(false);
        }
        _setViewPurchase(id);
      });
    }
  };
  const setViewCustomer = (id: string | null, force = false) => force ? (clearAllDirtyForms(), _setViewCustomer(id)) : requestNavigation(() => _setViewCustomer(id));
  const setViewSupplier = (id: string | null, force = false) => force ? (clearAllDirtyForms(), _setViewSupplier(id)) : requestNavigation(() => _setViewSupplier(id));
  const setIsCreatingInvoice = (val: boolean, force = false) => force ? (clearAllDirtyForms(), _setIsCreatingInvoice(val)) : requestNavigation(() => _setIsCreatingInvoice(val));
  const setIsCreatingQuotation = (val: boolean, force = false) => force ? (clearAllDirtyForms(), _setIsCreatingQuotation(val)) : requestNavigation(() => _setIsCreatingQuotation(val));
  const setIsEnteringPurchase = (val: boolean, force = false) => force ? (clearAllDirtyForms(), _setIsEnteringPurchase(val)) : requestNavigation(() => _setIsEnteringPurchase(val));
  const setIsEditingProduct = (product: Product | null, force = false) => force ? (clearAllDirtyForms(), _setIsEditingProduct(product)) : requestNavigation(() => _setIsEditingProduct(product));
  const setIsEditingCustomer = (customer: Customer | null, force = false) => force ? (clearAllDirtyForms(), _setIsEditingCustomer(customer)) : requestNavigation(() => _setIsEditingCustomer(customer));
  const setIsEditingSupplier = (supplier: Supplier | null, force = false) => force ? (clearAllDirtyForms(), _setIsEditingSupplier(supplier)) : requestNavigation(() => _setIsEditingSupplier(supplier));
  const [salesActiveTab, setSalesActiveTab] = useState<'invoices' | 'quotations'>('invoices');
  const [paymentFormPreset, setPaymentFormPreset] = useState<{ contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' } | null>(null);
  const [salesFormPresetCustomerId, setSalesFormPresetCustomerId] = useState<string | null>(null);
  const [purchaseFormPresetSupplierId, setPurchaseFormPresetSupplierId] = useState<string | null>(null);

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [contactId, setContactId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [initialPaymentValues, setInitialPaymentValues] = useState<any>(null);

  useEffect(() => {
    if (!isPaymentFormOpen || !initialPaymentValues) {
      setFormDirty('payment-form', false);
      return;
    }
    const currentValues = {
      paymentType,
      contactId,
      paymentDate,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
    };
    const isDirty = !isDeepEqual(currentValues, initialPaymentValues);
    setFormDirty('payment-form', isDirty);
  }, [
    isPaymentFormOpen,
    initialPaymentValues,
    paymentType,
    contactId,
    paymentDate,
    amount,
    paymentMethod,
    referenceNumber,
    notes,
  ]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => curr && curr.message === message ? null : curr);
    }, 3000);
  };

  const openNewPaymentForm = (preset?: { contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' }) => {
    const defaults = {
      paymentType: preset ? preset.type : 'CustomerReceipt',
      contactId: preset ? preset.contactId : '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'UPI',
      referenceNumber: '',
      notes: '',
    };
    setEditingPaymentId(null);
    if (preset) {
      setPaymentType(preset.type);
      setContactId(preset.contactId);
    } else {
      setPaymentType('CustomerReceipt');
      setContactId('');
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmount(0);
    setPaymentMethod('UPI');
    setReferenceNumber('');
    setNotes('');
    setInitialPaymentValues(defaults);
    setIsPaymentFormOpen(true);
  };

  const openEditPaymentForm = (pay: Payment) => {
    const values = {
      paymentType: pay.type,
      contactId: pay.contactId,
      paymentDate: pay.date,
      amount: pay.amount,
      paymentMethod: pay.paymentMethod as any,
      referenceNumber: pay.referenceNumber || '',
      notes: pay.notes || '',
    };
    setEditingPaymentId(pay.id);
    setPaymentType(pay.type);
    setContactId(pay.contactId);
    setPaymentDate(pay.date);
    setAmount(pay.amount);
    setPaymentMethod(pay.paymentMethod as any);
    setReferenceNumber(pay.referenceNumber || '');
    setNotes(pay.notes || '');
    setInitialPaymentValues(values);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) {
      showToast('Please select a contact to log payment.', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    const contactName =
      paymentType === 'CustomerReceipt'
        ? customers.find((c) => c.id === contactId)?.name || 'Unknown Customer'
        : suppliers.find((s) => s.id === contactId)?.name || 'Unknown Supplier';

    if (editingPaymentId) {
      editPayment({
        id: editingPaymentId,
        date: paymentDate,
        type: paymentType,
        contactId,
        contactName,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setEditingPaymentId(null);
    } else {
      addPayment({
        date: paymentDate,
        type: paymentType,
        contactId,
        contactName,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    clearAllDirtyForms();
    setContactId('');
    setAmount(0);
    setReferenceNumber('');
    setNotes('');
    setIsPaymentFormOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const navigateTab = (tab: string) => {
    requestNavigation(() => {
      window.history.pushState({ tab }, '', '#' + tab);
      _setCurrentTab(tab);
      _setViewInvoice(null);
      _setViewQuotation(null);
      _setViewPurchase(null);
      _setViewCustomer(null);
      _setViewSupplier(null);
      _setIsCreatingInvoice(false);
      _setIsCreatingQuotation(false);
      _setIsEnteringPurchase(false);
      setSearchQuery('');
    });
  };

  // Mount sync to ensure URL hash matches initial load tab in history
  useEffect(() => {
    const initialTab = window.location.hash.slice(1) || 'dashboard';
    _setCurrentTab(initialTab);
    window.history.replaceState({ tab: initialTab }, '', '#' + initialTab);
  }, []);

  // Intercept browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetTab = event.state?.tab || window.location.hash.slice(1) || 'dashboard';
      if (targetTab === currentTab) return;

      if (Object.values(dirtyForms).some(Boolean)) {
        pendingCallbacksRef.current = [
          () => {
            window.history.replaceState({ tab: targetTab }, '', '#' + targetTab);
            _setCurrentTab(targetTab);
            _setViewInvoice(null);
            _setViewQuotation(null);
            _setViewPurchase(null);
            _setViewCustomer(null);
            _setViewSupplier(null);
            _setIsCreatingInvoice(false);
            _setIsCreatingQuotation(false);
            _setIsEnteringPurchase(false);
            setSearchQuery('');
          }
        ];
        setShowUnsavedModal(true);
        window.history.pushState({ tab: currentTab }, '', '#' + currentTab);
      } else {
        _setCurrentTab(targetTab);
        _setViewInvoice(null);
        _setViewQuotation(null);
        _setViewPurchase(null);
        _setViewCustomer(null);
        _setViewSupplier(null);
        _setIsCreatingInvoice(false);
        _setIsCreatingQuotation(false);
        _setIsEnteringPurchase(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab, dirtyForms]);

  // Intercept tab closing or browser refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.values(dirtyForms).some(Boolean)) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. If you leave this page now, your changes will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyForms]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const synchronize = async () => {
    await reloadData();
  };

  // --- REST API CRUD ACTIONS ---

  const addProduct = async (p: Omit<Product, 'id'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot add product while offline.', 'error');
      return null;
    }
    const id = generateId('PROD');
    const newProduct: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
      id,
    };

    try {
      await api.post('/products', { ...newProduct, productId: id });
      setProducts((prev) => [...prev, newProduct]);
      notifyMutation();
      showToast('Product added successfully!');
      return newProduct;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add product', 'error');
      return null;
    }
  };

  const editProduct = async (p: Product) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update product while offline.', 'error');
      return;
    }
    const formatted: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
    };

    try {
      await api.put(`/products/${p.id}`, formatted);
      setProducts((prev) => prev.map((item) => (item.id === p.id ? formatted : item)));
      notifyMutation();
      showToast('Product updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update product', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete product while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      notifyMutation();
      showToast('Product soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  const addCustomer = async (c: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot add customer while offline.', 'error');
      return null;
    }
    const id = generateId('CUS');
    const newCustomer: Customer = {
      ...c,
      name: toTitleCase(c.name),
      id,
      outstanding: c.outstanding || 0,
    };

    try {
      await api.post('/customers', { ...newCustomer, customerId: id, phone: newCustomer.phone || 'N/A' });
      setCustomers((prev) => [...prev, newCustomer]);
      notifyMutation();
      showToast('Customer added successfully!');
      return newCustomer;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add customer', 'error');
      return null;
    }
  };

  const editCustomer = async (c: Customer) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update customer while offline.', 'error');
      return;
    }
    const formatted: Customer = {
      ...c,
      name: toTitleCase(c.name),
    };

    try {
      await api.put(`/customers/${c.id}`, { ...formatted, phone: formatted.phone || 'N/A' });
      setCustomers((prev) => prev.map((item) => (item.id === c.id ? formatted : item)));
      notifyMutation();
      showToast('Customer updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update customer', 'error');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete customer while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((item) => item.id !== id));
      notifyMutation();
      showToast('Customer soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete customer', 'error');
    }
  };

  const addSupplier = async (s: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot add supplier while offline.', 'error');
      return null;
    }
    const id = generateId('SUP');
    const newSupplier: Supplier = {
      ...s,
      name: toTitleCase(s.name),
      id,
      outstanding: s.outstanding || 0,
    };

    try {
      await api.post('/suppliers', { ...newSupplier, supplierId: id, phone: newSupplier.phone || 'N/A' });
      setSuppliers((prev) => [...prev, newSupplier]);
      notifyMutation();
      showToast('Supplier added successfully!');
      return newSupplier;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add supplier', 'error');
      return null;
    }
  };

  const editSupplier = async (s: Supplier) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update supplier while offline.', 'error');
      return;
    }
    const formatted: Supplier = {
      ...s,
      name: toTitleCase(s.name),
    };

    try {
      await api.put(`/suppliers/${s.id}`, { ...formatted, phone: formatted.phone || 'N/A' });
      setSuppliers((prev) => prev.map((item) => (item.id === s.id ? formatted : item)));
      notifyMutation();
      showToast('Supplier updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update supplier', 'error');
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete supplier while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers((prev) => prev.filter((item) => item.id !== id));
      notifyMutation();
      showToast('Supplier soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete supplier', 'error');
    }
  };

  const addInvoice = async (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot create invoice while offline.', 'error');
      return null;
    }
    const count = invoices.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const invoiceNumber = `${settings.invoicePrefix}${formattedCount}`;
    const id = generateId('INV');

    const newInvoice: Invoice = {
      ...inv,
      customerName: toTitleCase(inv.customerName),
      items: (inv.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
      id,
      invoiceNumber,
    };

    try {
      await api.post('/invoices', { ...newInvoice, invoiceId: id, invoiceNumber });
      setInvoices((prev) => [newInvoice, ...prev]);
      notifyMutation();
      showToast('Invoice created successfully!');
      reloadData();
      return newInvoice;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create invoice', 'error');
      return null;
    }
  };

  const editInvoice = async (updatedInvoice: Invoice) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update invoice while offline.', 'error');
      return;
    }
    const formattedInvoice: Invoice = {
      ...updatedInvoice,
      customerName: toTitleCase(updatedInvoice.customerName),
      items: (updatedInvoice.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    try {
      await api.put(`/invoices/${formattedInvoice.id}`, formattedInvoice);
      setInvoices((prev) => prev.map((item) => (item.id === formattedInvoice.id ? formattedInvoice : item)));
      notifyMutation();
      showToast('Invoice updated successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update invoice', 'error');
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete invoice while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices((prev) => prev.filter((item) => item.id !== id));
      notifyMutation();
      showToast('Invoice soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete invoice', 'error');
    }
  };

  const addQuotation = async (q: Omit<Quotation, 'id' | 'quotationNumber'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot create quotation while offline.', 'error');
      return null;
    }
    const count = quotations.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const quotationNumber = `QT-${formattedCount}`;
    const id = generateId('QUO');

    const newQuotation: Quotation = {
      ...q,
      customerName: toTitleCase(q.customerName),
      items: (q.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
      id,
      quotationNumber,
    };

    try {
      await api.post('/quotations', { ...newQuotation, quotationId: id, quotationNumber });
      setQuotations((prev) => [newQuotation, ...prev]);
      notifyMutation();
      showToast('Quotation created successfully!');
      return newQuotation;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create quotation', 'error');
      return null;
    }
  };

  const editQuotation = async (q: Quotation) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update quotation while offline.', 'error');
      return;
    }
    const formatted: Quotation = {
      ...q,
      customerName: toTitleCase(q.customerName),
      items: (q.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    try {
      await api.put(`/quotations/${q.id}`, formatted);
      setQuotations((prev) => prev.map((item) => (item.id === q.id ? formatted : item)));
      notifyMutation();
      showToast('Quotation updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update quotation', 'error');
    }
  };

  const deleteQuotation = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete quotation while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/quotations/${id}`);
      setQuotations((prev) => prev.filter((item) => item.id !== id));
      notifyMutation();
      showToast('Quotation soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete quotation', 'error');
    }
  };

  const convertQuotationToInvoice = async (quotationId: string, amountPaid: number, paymentMethod: string): Promise<string | null> => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot convert quotation while offline.', 'error');
      return null;
    }
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      showToast(`Quotation not found: ${quotationId}`, 'error');
      return null;
    }

    const invoiceItems = quotation.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      gstRate: item.gstRate,
      gstAmount: item.gstAmount,
      subtotal: item.subtotal,
      total: item.total,
    }));

    const todayDate = new Date().toISOString().split('T')[0];

    const newInvoice = await addInvoice({
      date: todayDate,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      items: invoiceItems,
      subtotal: quotation.subtotal,
      discountTotal: quotation.discountTotal,
      gstTotal: quotation.gstTotal,
      grandTotal: quotation.grandTotal,
      amountPaid: amountPaid,
      balanceDue: Math.max(0, quotation.grandTotal - amountPaid),
      paymentStatus: amountPaid >= quotation.grandTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid',
      paymentMethod: amountPaid > 0 ? paymentMethod : '',
      notes: `Converted from Quotation ${quotation.quotationNumber}.` + (quotation.notes ? `\nOriginal Notes: ${quotation.notes}` : ''),
    });

    if (newInvoice) {
      await editQuotation({ ...quotation, status: 'Converted', convertedInvoiceId: newInvoice.id });
      return newInvoice.id;
    }
    return null;
  };

  const addPurchase = async (pur: Omit<Purchase, 'id' | 'purchaseNumber'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot record purchase while offline.', 'error');
      return null;
    }
    const count = purchases.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const purchaseNumber = `PUR-${settings.invoicePrefix.replace('AB-', '')}${formattedCount}`;
    const id = generateId('PUR');

    const newPurchase: Purchase = {
      ...pur,
      supplierName: toTitleCase(pur.supplierName),
      items: (pur.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
      id,
      purchaseNumber,
    };

    try {
      await api.post('/purchases', { ...newPurchase, purchaseId: id, purchaseNumber });
      setPurchases((prev) => [newPurchase, ...prev]);
      notifyMutation();
      showToast('Purchase recorded successfully!');
      reloadData();
      return newPurchase;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record purchase', 'error');
      return null;
    }
  };

  const editPurchase = async (updatedPurchase: Purchase) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update purchase while offline.', 'error');
      return;
    }
    const formattedPurchase: Purchase = {
      ...updatedPurchase,
      supplierName: toTitleCase(updatedPurchase.supplierName),
      items: (updatedPurchase.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    try {
      await api.put(`/purchases/${formattedPurchase.id}`, formattedPurchase);
      setPurchases((prev) => prev.map((item) => (item.id === formattedPurchase.id ? formattedPurchase : item)));
      notifyMutation();
      showToast('Purchase updated successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update purchase', 'error');
    }
  };

  const deletePurchase = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete purchase while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/purchases/${id}`);
      notifyMutation();
      showToast('Purchase soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete purchase', 'error');
    }
  };

  const addPayment = async (pay: Omit<Payment, 'id'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot log payment while offline.', 'error');
      return;
    }
    const id = generateId('PAY');
    const newPayment: Payment = {
      ...pay,
      contactName: toTitleCase(pay.contactName),
      id,
    };

    try {
      await api.post('/payments', { ...newPayment, paymentId: id });
      notifyMutation();
      showToast('Payment logged successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to log payment', 'error');
    }
  };

  const editPayment = async (updatedPayment: Payment) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update payment while offline.', 'error');
      return;
    }
    const formattedPayment: Payment = {
      ...updatedPayment,
      contactName: toTitleCase(updatedPayment.contactName),
    };

    try {
      await api.put(`/payments/${formattedPayment.id}`, formattedPayment);
      notifyMutation();
      showToast('Payment updated successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update payment', 'error');
    }
  };

  const deletePayment = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete payment while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/payments/${id}`);
      notifyMutation();
      showToast('Payment soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete payment', 'error');
    }
  };

  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot add expense while offline.', 'error');
      return null;
    }
    const id = generateId('EXP');
    const newExpense: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
      id,
    };

    try {
      await api.post('/expenses', { ...newExpense, expenseId: id });
      setExpenses((prev) => [...prev, newExpense]);
      notifyMutation();
      showToast('Expense logged successfully!');
      return newExpense;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add expense', 'error');
      return null;
    }
  };

  const editExpense = async (exp: Expense) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update expense while offline.', 'error');
      return;
    }
    const formatted: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
    };

    try {
      await api.put(`/expenses/${exp.id}`, formatted);
      setExpenses((prev) => prev.map((item) => (item.id === exp.id ? formatted : item)));
      notifyMutation();
      showToast('Expense updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update expense', 'error');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete expense while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      notifyMutation();
      showToast('Expense soft-deleted successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete expense', 'error');
    }
  };

  // --- Recycle Bin Restoration / Permanent Deletion Actions ---

  const restoreRecord = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot restore item while offline.', 'error');
      return;
    }
    try {
      await api.post(`/recycle-bin/${id}/restore`);
      notifyMutation();
      showToast('Record restored successfully!');
      reloadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to restore record', 'error');
    }
  };

  const deletePermanently = async (id: string) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot delete item while offline.', 'error');
      return;
    }
    try {
      await api.delete(`/recycle-bin/${id}`);
      notifyMutation();
      showToast('Record permanently deleted!');
      setRecycleBin((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete record permanently', 'error');
    }
  };

  const restoreRecords = (ids: string[]) => {
    ids.forEach((id) => restoreRecord(id));
  };

  const deleteRecordsPermanently = (ids: string[]) => {
    ids.forEach((id) => deletePermanently(id));
  };

  const updateSettings = async (updatedSettings: BusinessSettings) => {
    if (!navigator.onLine) {
      showToast('No internet connection. Cannot update settings while offline.', 'error');
      return;
    }
    const formatted = {
      ...updatedSettings,
      businessName: toTitleCase(updatedSettings.businessName),
      ownerName: toTitleCase(updatedSettings.ownerName),
    };
    
    try {
      await api.put('/settings', formatted);
      setSettings(formatted);
      clearAllDirtyForms();
      localStorage.setItem('agribiz_settings', JSON.stringify(formatted));
      setCachedBranding({
        logoUrl: formatted.logo || '',
        watermarkLogoUrl: formatted.watermarkLogo || '',
        businessName: formatted.businessName,
      });
      notifyMutation();
      document.title = formatted.businessName || 'AgriBiz';
      showToast('Settings saved successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    }
  };

  const resetToDefault = async () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        recycleBin,
        restoreRecord,
        deletePermanently,
        restoreRecords,
        deleteRecordsPermanently,
        products,
        customers,
        suppliers,
        invoices,
        quotations,
        purchases,
        payments,
        settings,
        activeTheme,
        currentTab,
        currentInvoiceId,
        currentQuotationId,
        currentPurchaseId,
        currentCustomerId,
        currentSupplierId,
        isCreatingInvoice,
        isCreatingQuotation,
        isEnteringPurchase,
        isEditingProduct,
        isEditingCustomer,
        isEditingSupplier,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
        isFormDirty,
        setFormDirty,
        clearAllDirtyForms,
        requestNavigation,
        showUnsavedModal,
        setShowUnsavedModal,
        confirmLeave,
        confirmStay,
        setCurrentTab,
        setViewInvoice,
        setViewQuotation,
        setViewPurchase,
        setViewCustomer,
        setViewSupplier,
        setIsCreatingInvoice,
        setIsCreatingQuotation,
        setIsEnteringPurchase,
        setIsEditingProduct,
        setIsEditingCustomer,
        setIsEditingSupplier,
        navigateTab,
        salesActiveTab,
        setSalesActiveTab,
        addProduct,
        editProduct,
        deleteProduct,
        addCustomer,
        editCustomer,
        deleteCustomer,
        addSupplier,
        editSupplier,
        deleteSupplier,
        addInvoice,
        editInvoice,
        deleteInvoice,
        addQuotation,
        editQuotation,
        deleteQuotation,
        convertQuotationToInvoice,
        addPurchase,
        editPurchase,
        deletePurchase,
        addPayment,
        editPayment,
        deletePayment,
        updateSettings,
        resetToDefault,
        expenses,
        addExpense,
        editExpense,
        deleteExpense,
        paymentFormPreset,
        setPaymentFormPreset,
        salesFormPresetCustomerId,
        setSalesFormPresetCustomerId,
        purchaseFormPresetSupplierId,
        setPurchaseFormPresetSupplierId,
        isPaymentFormOpen,
        setIsPaymentFormOpen,
        paymentType,
        setPaymentType,
        contactId,
        setContactId,
        paymentDate,
        setPaymentDate,
        amount,
        setAmount,
        paymentMethod,
        setPaymentMethod,
        referenceNumber,
        setReferenceNumber,
        notes,
        setNotes,
        editingPaymentId,
        setEditingPaymentId,
        openNewPaymentForm,
        openEditPaymentForm,
        handleSavePayment,
        isOnline,
        reloadData,
        synchronize,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key of keys) {
      if (!isDeepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

export const useUnsavedChanges = (formId: string, currentValues: any, initialValues: any, active: boolean = true) => {
  const { setFormDirty } = useApp();
  
  useEffect(() => {
    if (!active) {
      setFormDirty(formId, false);
      return;
    }
    const isDirty = !isDeepEqual(currentValues, initialValues);
    setFormDirty(formId, isDirty);
    
    return () => {
      setFormDirty(formId, false);
    };
  }, [formId, currentValues, initialValues, active, setFormDirty]);
};
