import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Product, Customer, Supplier, Invoice, Purchase, Payment, BusinessSettings, Expense, Quotation, RecycleBinItem } from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialInvoices,
  initialPurchases,
  initialPayments,
  initialSettings,
  initialExpenses,
  toTitleCase,
} from '../utils/dummyData';
import { db } from '../db/db';
import { startSyncDaemon, getDeviceId, synchronizeLocalDatabase } from '../utils/syncEngine';

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

  setCurrentTab: (tab: string) => void;
  setViewInvoice: (id: string | null) => void;
  setViewQuotation: (id: string | null) => void;
  setViewPurchase: (id: string | null) => void;
  setViewCustomer: (id: string | null) => void;
  setViewSupplier: (id: string | null) => void;
  setIsCreatingInvoice: (val: boolean) => void;
  setIsCreatingQuotation: (val: boolean) => void;
  setIsEnteringPurchase: (val: boolean) => void;
  setIsEditingProduct: (product: Product | null) => void;
  setIsEditingCustomer: (customer: Customer | null) => void;
  setIsEditingSupplier: (supplier: Supplier | null) => void;
  navigateTab: (tab: string) => void;

  salesActiveTab: 'invoices' | 'quotations';
  setSalesActiveTab: (tab: 'invoices' | 'quotations') => void;

  addProduct: (product: Omit<Product, 'id'>) => Product;
  editProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => Customer;
  editCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => Supplier;
  editSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  editInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber'>) => Quotation;
  editQuotation: (quotation: Quotation) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToInvoice: (quotationId: string, amountPaid: number, paymentMethod: string) => string;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNumber'>) => Purchase;
  editPurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id'>) => void;
  editPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;

  updateSettings: (settings: BusinessSettings) => void;
  resetToDefault: () => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
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

// Queue database operations for sync in Milestone 5
const queueSync = async (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  module: 'Product' | 'Customer' | 'Supplier' | 'Invoice' | 'Quotation' | 'Purchase' | 'Payment' | 'Expense' | 'Settings',
  recordId: string,
  payload: any
) => {
  try {
    let enrichedPayload = payload ? JSON.parse(JSON.stringify(payload)) : null;
    if (enrichedPayload) {
      enrichedPayload.deviceId = getDeviceId();
      enrichedPayload.syncStatus = 'Pending';
      if (!enrichedPayload.version) {
        enrichedPayload.version = 1;
      }
    }
    await db.syncQueue.add({
      action,
      module,
      recordId,
      payload: enrichedPayload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    console.log(`Queued offline operation: ${action} on ${module} (${recordId})`);
  } catch (err) {
    console.error('Failed to queue sync operation:', err);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-Memory mirrors of Dexie database
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);

  // Small settings & theme managed in localStorage
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const local = localStorage.getItem('agribiz_settings');
    const raw = local ? { ...initialSettings, ...JSON.parse(local) } : initialSettings;
    return {
      ...raw,
      businessName: toTitleCase(raw.businessName),
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

  const reloadData = async () => {
    console.log('[App Context] reloadData() started.');
    try {
      const localProducts = await db.products.toArray();
      const localCustomers = await db.customers.toArray();
      const localSuppliers = await db.suppliers.toArray();
      const localInvoices = await db.invoices.toArray();
      const localQuotations = await db.quotations.toArray();
      const localPurchases = await db.purchases.toArray();
      const localPayments = await db.payments.toArray();
      const localExpenses = await db.expenses.toArray();
      const localRecycleBin = await db.recycleBin.toArray();

      setProducts(localProducts.filter((p) => !p.isDeleted));
      setCustomers(localCustomers.filter((c) => !c.isDeleted));
      setSuppliers(localSuppliers.filter((s) => !s.isDeleted));
      setInvoices(localInvoices.filter((i) => !i.isDeleted));
      setQuotations(localQuotations.filter((q) => !q.isDeleted));
      setPurchases(localPurchases.filter((p) => !p.isDeleted));
      setPayments(localPayments.filter((p) => !p.isDeleted));
      setExpenses(localExpenses.filter((e) => !e.isDeleted));
      setRecycleBin(localRecycleBin);

      const localSettings = await db.settings.get('business');
      if (localSettings) {
        setSettings(localSettings);
      }
      console.log('[App Context] reloadData() finished.');
      console.log('[App Context] React Context updated.');
    } catch (err) {
      console.error('Failed to reload local database:', err);
    }
  };

  const synchronize = async () => {
    await synchronizeLocalDatabase();
  };

  // Fetch from Dexie on App Load, or seed if empty
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const productCount = await db.products.count();
        if (productCount === 0) {
          console.log('IndexedDB is empty, seeding initial mock data...');

          // Seed products
          await db.products.bulkAdd(
            initialProducts.map((p) => ({
              ...p,
              name: toTitleCase(p.name),
              category: toTitleCase(p.category),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed customers
          await db.customers.bulkAdd(
            initialCustomers.map((c) => ({
              ...c,
              name: toTitleCase(c.name),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed suppliers
          await db.suppliers.bulkAdd(
            initialSuppliers.map((s) => ({
              ...s,
              name: toTitleCase(s.name),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed invoices
          await db.invoices.bulkAdd(
            initialInvoices.map((inv) => ({
              ...inv,
              customerName: toTitleCase(inv.customerName),
              items: inv.items.map((item) => ({
                ...item,
                productName: toTitleCase(item.productName),
              })),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed payments
          await db.payments.bulkAdd(
            initialPayments.map((pay) => ({
              ...pay,
              contactName: toTitleCase(pay.contactName),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed expenses
          await db.expenses.bulkAdd(
            initialExpenses.map((exp) => ({
              ...exp,
              payee: toTitleCase(exp.payee),
              category: toTitleCase(exp.category),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed purchases
          await db.purchases.bulkAdd(
            initialPurchases.map((p) => ({
              ...p,
              supplierName: toTitleCase(p.supplierName),
              items: p.items.map((item) => ({
                ...item,
                productName: toTitleCase(item.productName),
              })),
              isDeleted: false,
              version: 1,
            }))
          );

          // Seed default business settings
          const settingsCount = await db.settings.count();
          if (settingsCount === 0) {
            await db.settings.add({
              ...settings,
              id: 'business',
            });
          }
        }

        await reloadData();
        console.log('IndexedDB loaded successfully.');
        startSyncDaemon();
      } catch (err) {
        console.error('IndexedDB loading failed:', err);
      }
    };

    initializeDatabase();
  }, []);

  // Listen for sync complete events
  useEffect(() => {
    const handleSyncComplete = async () => {
      console.log('[App Context] Sync complete event received. Reloading Dexie data...');
      await reloadData();
      console.log('[App Context] React Context refreshed with reloaded Dexie data.');
    };

    window.addEventListener('sync-completed', handleSyncComplete);
    return () => {
      window.removeEventListener('sync-completed', handleSyncComplete);
    };
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

  const setCurrentTab = (tab: string) => requestNavigation(() => { window.history.pushState({ tab }, '', '#' + tab); _setCurrentTab(tab); });
  const setViewInvoice = (id: string | null) => requestNavigation(() => _setViewInvoice(id));
  const setViewQuotation = (id: string | null) => requestNavigation(() => _setViewQuotation(id));
  const setViewPurchase = (id: string | null) => requestNavigation(() => _setViewPurchase(id));
  const setViewCustomer = (id: string | null) => requestNavigation(() => _setViewCustomer(id));
  const setViewSupplier = (id: string | null) => requestNavigation(() => _setViewSupplier(id));
  const setIsCreatingInvoice = (val: boolean) => requestNavigation(() => _setIsCreatingInvoice(val));
  const setIsCreatingQuotation = (val: boolean) => requestNavigation(() => _setIsCreatingQuotation(val));
  const setIsEnteringPurchase = (val: boolean) => requestNavigation(() => _setIsEnteringPurchase(val));
  const setIsEditingProduct = (product: Product | null) => requestNavigation(() => _setIsEditingProduct(product));
  const setIsEditingCustomer = (customer: Customer | null) => requestNavigation(() => _setIsEditingCustomer(customer));
  const setIsEditingSupplier = (supplier: Supplier | null) => requestNavigation(() => _setIsEditingSupplier(supplier));
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
      showToast(`Payment of ₹${amount.toLocaleString('en-IN')} updated successfully!`);
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
      showToast(`Payment of ₹${amount.toLocaleString('en-IN')} logged successfully!`);
    }

    setContactId('');
    setAmount(0);
    setReferenceNumber('');
    setNotes('');
    setIsPaymentFormOpen(false);
  };

  // Theme synchronization logic
  useEffect(() => {
    const updateActiveTheme = () => {
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActiveTheme(isDark ? 'dark' : 'light');
      } else {
        setActiveTheme(settings.theme || 'light');
      }
    };

    updateActiveTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        updateActiveTheme();
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  useEffect(() => {
    document.body.className = activeTheme === 'dark' ? 'dark-theme' : 'light-theme';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    const color = activeTheme === 'dark' ? '#0b0f19' : '#f8fafc';
    metaThemeColor.setAttribute('content', color);
  }, [activeTheme]);

  // --- CRUD ACTIONS backed by Dexie.js ---

  const addProduct = (p: Omit<Product, 'id'>) => {
    const id = generateId('PROD');
    const newProduct: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
      id,
    };
    
    setProducts((prev) => [...prev, newProduct]);
    
    // Save locally
    const dbRecord = { ...newProduct, isDeleted: false, version: 1 };
    db.products.add(dbRecord);
    
    // Queue offline sync
    queueSync('CREATE', 'Product', id, newProduct);
    
    return newProduct;
  };

  const editProduct = (p: Product) => {
    const formatted: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
    };
    
    setProducts((prev) => prev.map((item) => (item.id === p.id ? formatted : item)));
    
    // Save locally
    const dbRecord = { ...formatted, isDeleted: false, version: 1 };
    db.products.put(dbRecord);
    
    // Queue offline sync
    queueSync('UPDATE', 'Product', p.id, formatted);
  };

  const deleteProduct = (id: string) => {
    const item = products.find((p) => p.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: generateId('REC'),
        originalId: item.id,
        name: item.name,
        module: 'Product',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Vaibhav Patel',
        originalData: item,
      };

      // Atomic local updates
      db.products.update(id, { isDeleted: true });
      db.recycleBin.add(binItem);
      
      // Update state
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setRecycleBin((prev) => [binItem, ...prev]);
      
      // Queue offline sync
      queueSync('DELETE', 'Product', id, null);
    }
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const id = generateId('CUS');
    const newCustomer: Customer = {
      ...c,
      name: toTitleCase(c.name),
      id,
      outstanding: c.outstanding || 0,
    };
    
    setCustomers((prev) => [...prev, newCustomer]);
    
    const dbRecord = { ...newCustomer, isDeleted: false, version: 1 };
    db.customers.add(dbRecord);
    
    queueSync('CREATE', 'Customer', id, newCustomer);
    
    return newCustomer;
  };

  const editCustomer = (c: Customer) => {
    const formatted: Customer = {
      ...c,
      name: toTitleCase(c.name),
    };
    
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? formatted : item)));
    
    const dbRecord = { ...formatted, isDeleted: false, version: 1 };
    db.customers.put(dbRecord);
    
    queueSync('UPDATE', 'Customer', c.id, formatted);
  };

  const deleteCustomer = (id: string) => {
    const item = customers.find((c) => c.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: generateId('REC'),
        originalId: item.id,
        name: item.name,
        module: 'Customer',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Vaibhav Patel',
        originalData: item,
      };

      db.customers.update(id, { isDeleted: true });
      db.recycleBin.add(binItem);

      setCustomers((prev) => prev.filter((item) => item.id !== id));
      setRecycleBin((prev) => [binItem, ...prev]);

      queueSync('DELETE', 'Customer', id, null);
    }
  };

  const addSupplier = (s: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const id = generateId('SUP');
    const newSupplier: Supplier = {
      ...s,
      name: toTitleCase(s.name),
      id,
      outstanding: s.outstanding || 0,
    };

    setSuppliers((prev) => [...prev, newSupplier]);

    const dbRecord = { ...newSupplier, isDeleted: false, version: 1 };
    db.suppliers.add(dbRecord);

    queueSync('CREATE', 'Supplier', id, newSupplier);

    return newSupplier;
  };

  const editSupplier = (s: Supplier) => {
    const formatted: Supplier = {
      ...s,
      name: toTitleCase(s.name),
    };

    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? formatted : item)));

    const dbRecord = { ...formatted, isDeleted: false, version: 1 };
    db.suppliers.put(dbRecord);

    queueSync('UPDATE', 'Supplier', s.id, formatted);
  };

  const deleteSupplier = (id: string) => {
    const item = suppliers.find((s) => s.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: generateId('REC'),
        originalId: item.id,
        name: item.name,
        module: 'Supplier',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Vaibhav Patel',
        originalData: item,
      };

      db.suppliers.update(id, { isDeleted: true });
      db.recycleBin.add(binItem);

      setSuppliers((prev) => prev.filter((item) => item.id !== id));
      setRecycleBin((prev) => [binItem, ...prev]);

      queueSync('DELETE', 'Supplier', id, null);
    }
  };

  const addInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
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

    // Calculate stock changes locally
    const updatedProducts = products.map((p) => {
      const matchingItem = inv.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = Math.max(0, p.stock - matchingItem.quantity);
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Calculate customer dues locally
    const updatedCustomers = customers.map((cust) => {
      if (cust.id === inv.customerId) {
        const finalDues = cust.outstanding + inv.balanceDue;
        db.customers.update(cust.id, { outstanding: finalDues });
        return { ...cust, outstanding: finalDues };
      }
      return cust;
    });

    // Handle instant payments locally
    let generatedPayment: Payment | null = null;
    if (inv.amountPaid > 0) {
      const paymentId = generateId('PAY');
      generatedPayment = {
        id: paymentId,
        date: inv.date,
        type: 'CustomerReceipt',
        contactId: inv.customerId,
        contactName: inv.customerName,
        amount: inv.amountPaid,
        paymentMethod: (inv.paymentMethod as any) || 'UPI',
        notes: `Against invoice ${invoiceNumber}`,
      };
      db.payments.add({ ...generatedPayment, isDeleted: false, version: 1 });
      queueSync('CREATE', 'Payment', paymentId, generatedPayment);
    }

    // Save locally
    db.invoices.add({ ...newInvoice, isDeleted: false, version: 1 });
    queueSync('CREATE', 'Invoice', id, newInvoice);

    // Apply updates atomically to state
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    if (generatedPayment) {
      setPayments((prev) => [generatedPayment!, ...prev]);
    }
    setInvoices((prev) => [newInvoice, ...prev]);

    return newInvoice;
  };

  const editInvoice = (updatedInvoice: Invoice) => {
    const oldInvoice = invoices.find((i) => i.id === updatedInvoice.id);
    if (!oldInvoice) {
      throw new Error(`Original invoice not found: ${updatedInvoice.invoiceNumber}`);
    }

    // Revert old stock changes
    const revertedProducts = products.map((p) => {
      const matchingItem = oldInvoice.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        return { ...p, stock: p.stock + matchingItem.quantity };
      }
      return p;
    });

    // Revert old customer dues
    const revertedCustomers = customers.map((cust) => {
      if (cust.id === oldInvoice.customerId) {
        return { ...cust, outstanding: cust.outstanding - oldInvoice.balanceDue };
      }
      return cust;
    });

    // Apply new stock changes
    const finalProducts = revertedProducts.map((p) => {
      const matchingItem = updatedInvoice.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = Math.max(0, p.stock - matchingItem.quantity);
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Apply new customer dues
    const finalCustomers = revertedCustomers.map((cust) => {
      if (cust.id === updatedInvoice.customerId) {
        const finalDues = cust.outstanding + updatedInvoice.balanceDue;
        db.customers.update(cust.id, { outstanding: finalDues });
        return { ...cust, outstanding: finalDues };
      }
      return cust;
    });

    const formattedInvoice: Invoice = {
      ...updatedInvoice,
      customerName: toTitleCase(updatedInvoice.customerName),
      items: (updatedInvoice.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    // Save locally
    db.invoices.put({ ...formattedInvoice, isDeleted: false, version: 1 });
    queueSync('UPDATE', 'Invoice', formattedInvoice.id, formattedInvoice);

    setProducts(finalProducts);
    setCustomers(finalCustomers);
    setInvoices((prev) => prev.map((inv) => (inv.id === oldInvoice.id ? formattedInvoice : inv)));
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) return;

    const binItem: RecycleBinItem = {
      id: generateId('REC'),
      originalId: inv.id,
      name: inv.invoiceNumber,
      module: 'Invoice',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Vaibhav Patel',
      originalData: inv,
    };

    // Restore stocks locally
    const finalProducts = products.map((p) => {
      const matchingItem = inv.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = p.stock + matchingItem.quantity;
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Revert customer dues locally
    const finalCustomers = customers.map((cust) => {
      if (cust.id === inv.customerId) {
        const finalDues = Math.max(0, cust.outstanding - inv.balanceDue);
        db.customers.update(cust.id, { outstanding: finalDues });
        return { ...cust, outstanding: finalDues };
      }
      return cust;
    });

    // Save locally
    db.invoices.update(inv.id, { isDeleted: true });
    db.recycleBin.add(binItem);

    setProducts(finalProducts);
    setCustomers(finalCustomers);
    setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    setRecycleBin((prev) => [binItem, ...prev]);

    queueSync('DELETE', 'Invoice', inv.id, null);
  };

  const addQuotation = (q: Omit<Quotation, 'id' | 'quotationNumber'>) => {
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

    setQuotations((prev) => [newQuotation, ...prev]);

    db.quotations.add({ ...newQuotation, isDeleted: false, version: 1 });
    queueSync('CREATE', 'Quotation', id, newQuotation);

    return newQuotation;
  };

  const editQuotation = (q: Quotation) => {
    const formatted: Quotation = {
      ...q,
      customerName: toTitleCase(q.customerName),
      items: (q.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    setQuotations((prev) => prev.map((item) => (item.id === q.id ? formatted : item)));

    db.quotations.put({ ...formatted, isDeleted: false, version: 1 });
    queueSync('UPDATE', 'Quotation', q.id, formatted);
  };

  const deleteQuotation = (id: string) => {
    const item = quotations.find((q) => q.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: generateId('REC'),
        originalId: item.id,
        name: item.quotationNumber,
        module: 'Quotation',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Vaibhav Patel',
        originalData: item,
      };

      db.quotations.update(id, { isDeleted: true });
      db.recycleBin.add(binItem);

      setQuotations((prev) => prev.filter((item) => item.id !== id));
      setRecycleBin((prev) => [binItem, ...prev]);

      queueSync('DELETE', 'Quotation', id, null);
    }
  };

  const convertQuotationToInvoice = (quotationId: string, amountPaid: number, paymentMethod: string): string => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      throw new Error(`Quotation not found: ${quotationId}`);
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

    const newInvoice = addInvoice({
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

    db.quotations.update(quotationId, { status: 'Converted', convertedInvoiceId: newInvoice.id });
    queueSync('UPDATE', 'Quotation', quotationId, { ...quotation, status: 'Converted', convertedInvoiceId: newInvoice.id });

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId ? { ...q, status: 'Converted', convertedInvoiceId: newInvoice.id } : q
      )
    );

    return newInvoice.id;
  };

  const addPurchase = (pur: Omit<Purchase, 'id' | 'purchaseNumber'>) => {
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

    // Add stock locally
    const finalProducts = products.map((p) => {
      const matchingItem = pur.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = p.stock + matchingItem.quantity;
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Revert supplier balance locally
    const finalSuppliers = suppliers.map((supp) => {
      if (supp.id === pur.supplierId) {
        const finalDues = supp.outstanding + pur.balanceDue;
        db.suppliers.update(supp.id, { outstanding: finalDues });
        return { ...supp, outstanding: finalDues };
      }
      return supp;
    });

    // Payments logging
    let generatedPayment: Payment | null = null;
    if (pur.amountPaid > 0) {
      const paymentId = generateId('PAY');
      generatedPayment = {
        id: paymentId,
        date: pur.date,
        type: 'SupplierPayment',
        contactId: pur.supplierId,
        contactName: pur.supplierName,
        amount: pur.amountPaid,
        paymentMethod: (pur.paymentMethod as any) || 'Bank Transfer',
        notes: `Against bill ${purchaseNumber}`,
      };
      db.payments.add({ ...generatedPayment, isDeleted: false, version: 1 });
      queueSync('CREATE', 'Payment', paymentId, generatedPayment);
    }

    db.purchases.add({ ...newPurchase, isDeleted: false, version: 1 });
    queueSync('CREATE', 'Purchase', id, newPurchase);

    setProducts(finalProducts);
    setSuppliers(finalSuppliers);
    if (generatedPayment) {
      setPayments((prev) => [generatedPayment!, ...prev]);
    }
    setPurchases((prev) => [newPurchase, ...prev]);

    return newPurchase;
  };

  const editPurchase = (updatedPurchase: Purchase) => {
    const oldPurchase = purchases.find((p) => p.id === updatedPurchase.id);
    if (!oldPurchase) {
      throw new Error(`Original purchase not found: ${updatedPurchase.purchaseNumber}`);
    }

    // Revert old stock changes
    const revertedProducts = products.map((p) => {
      const matchingItem = oldPurchase.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        return { ...p, stock: Math.max(0, p.stock - matchingItem.quantity) };
      }
      return p;
    });

    // Revert old supplier dues
    const revertedSuppliers = suppliers.map((supp) => {
      if (supp.id === oldPurchase.supplierId) {
        return { ...supp, outstanding: supp.outstanding - oldPurchase.balanceDue };
      }
      return supp;
    });

    // Apply new stock changes
    const finalProducts = revertedProducts.map((p) => {
      const matchingItem = updatedPurchase.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = p.stock + matchingItem.quantity;
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Apply new supplier dues
    const finalSuppliers = revertedSuppliers.map((supp) => {
      if (supp.id === updatedPurchase.supplierId) {
        const finalDues = supp.outstanding + updatedPurchase.balanceDue;
        db.suppliers.update(supp.id, { outstanding: finalDues });
        return { ...supp, outstanding: finalDues };
      }
      return supp;
    });

    const formattedPurchase: Purchase = {
      ...updatedPurchase,
      supplierName: toTitleCase(updatedPurchase.supplierName),
      items: (updatedPurchase.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    db.purchases.put({ ...formattedPurchase, isDeleted: false, version: 1 });
    queueSync('UPDATE', 'Purchase', formattedPurchase.id, formattedPurchase);

    setProducts(finalProducts);
    setSuppliers(finalSuppliers);
    setPurchases((prev) => prev.map((p) => (p.id === oldPurchase.id ? formattedPurchase : p)));
  };

  const deletePurchase = (id: string) => {
    const pur = purchases.find((p) => p.id === id);
    if (!pur) return;

    const binItem: RecycleBinItem = {
      id: generateId('REC'),
      originalId: pur.id,
      name: pur.purchaseNumber,
      module: 'Purchase',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Vaibhav Patel',
      originalData: pur,
    };

    // Revert stock added locally
    const finalProducts = products.map((p) => {
      const matchingItem = pur.items.find((item) => item.productId === p.id);
      if (matchingItem) {
        const finalStock = Math.max(0, p.stock - matchingItem.quantity);
        db.products.update(p.id, { stock: finalStock });
        return { ...p, stock: finalStock };
      }
      return p;
    });

    // Revert supplier outstanding balance locally
    const finalSuppliers = suppliers.map((supp) => {
      if (supp.id === pur.supplierId) {
        const finalDues = Math.max(0, supp.outstanding - pur.balanceDue);
        db.suppliers.update(supp.id, { outstanding: finalDues });
        return { ...supp, outstanding: finalDues };
      }
      return supp;
    });

    db.purchases.update(pur.id, { isDeleted: true });
    db.recycleBin.add(binItem);

    setProducts(finalProducts);
    setSuppliers(finalSuppliers);
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    setRecycleBin((prev) => [binItem, ...prev]);

    queueSync('DELETE', 'Purchase', pur.id, null);
  };

  const addPayment = (pay: Omit<Payment, 'id'>) => {
    const id = generateId('PAY');
    const newPayment: Payment = {
      ...pay,
      contactName: toTitleCase(pay.contactName),
      id,
    };

    // Apply ledger changes locally
    const finalCustomers = customers.map((cust) => {
      if (pay.type === 'CustomerReceipt' && cust.id === pay.contactId) {
        const outstanding = cust.outstanding - pay.amount;
        db.customers.update(cust.id, { outstanding });
        return { ...cust, outstanding };
      }
      return cust;
    });

    const finalSuppliers = suppliers.map((supp) => {
      if (pay.type === 'SupplierPayment' && supp.id === pay.contactId) {
        const outstanding = supp.outstanding - pay.amount;
        db.suppliers.update(supp.id, { outstanding });
        return { ...supp, outstanding };
      }
      return supp;
    });

    db.payments.add({ ...newPayment, isDeleted: false, version: 1 });
    queueSync('CREATE', 'Payment', id, newPayment);

    setCustomers(finalCustomers);
    setSuppliers(finalSuppliers);
    setPayments((prev) => [newPayment, ...prev]);
  };

  const editPayment = (updatedPayment: Payment) => {
    const oldPayment = payments.find((p) => p.id === updatedPayment.id);
    if (!oldPayment) return;

    // Revert old outstanding
    let tempCustomers = customers;
    let tempSuppliers = suppliers;

    if (oldPayment.type === 'CustomerReceipt') {
      tempCustomers = customers.map((cust) => {
        if (cust.id === oldPayment.contactId) {
          return { ...cust, outstanding: cust.outstanding + oldPayment.amount };
        }
        return cust;
      });
    } else {
      tempSuppliers = suppliers.map((supp) => {
        if (supp.id === oldPayment.contactId) {
          return { ...supp, outstanding: supp.outstanding + oldPayment.amount };
        }
        return supp;
      });
    }

    // Apply new outstanding
    const finalCustomers = tempCustomers.map((cust) => {
      if (updatedPayment.type === 'CustomerReceipt' && cust.id === updatedPayment.contactId) {
        const outstanding = cust.outstanding - updatedPayment.amount;
        db.customers.update(cust.id, { outstanding });
        return { ...cust, outstanding };
      }
      return cust;
    });

    const finalSuppliers = tempSuppliers.map((supp) => {
      if (updatedPayment.type === 'SupplierPayment' && supp.id === updatedPayment.contactId) {
        const outstanding = supp.outstanding - updatedPayment.amount;
        db.suppliers.update(supp.id, { outstanding });
        return { ...supp, outstanding };
      }
      return supp;
    });

    const formattedPayment: Payment = {
      ...updatedPayment,
      contactName: toTitleCase(updatedPayment.contactName),
    };

    db.payments.put({ ...formattedPayment, isDeleted: false, version: 1 });
    queueSync('UPDATE', 'Payment', formattedPayment.id, formattedPayment);

    setCustomers(finalCustomers);
    setSuppliers(finalSuppliers);
    setPayments((prev) => prev.map((p) => (p.id === updatedPayment.id ? formattedPayment : p)));
  };

  const deletePayment = (id: string) => {
    const pay = payments.find((p) => p.id === id);
    if (!pay) return;

    const binItem: RecycleBinItem = {
      id: generateId('REC'),
      originalId: pay.id,
      name: `Payment: ₹${pay.amount} to ${pay.contactName}`,
      module: 'Payment',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Vaibhav Patel',
      originalData: pay,
    };

    // Revert outstanding balance locally
    const finalCustomers = customers.map((cust) => {
      if (pay.type === 'CustomerReceipt' && cust.id === pay.contactId) {
        const outstanding = cust.outstanding + pay.amount;
        db.customers.update(cust.id, { outstanding });
        return { ...cust, outstanding };
      }
      return cust;
    });

    const finalSuppliers = suppliers.map((supp) => {
      if (pay.type === 'SupplierPayment' && supp.id === pay.contactId) {
        const outstanding = supp.outstanding + pay.amount;
        db.suppliers.update(supp.id, { outstanding });
        return { ...supp, outstanding };
      }
      return supp;
    });

    db.payments.update(pay.id, { isDeleted: true });
    db.recycleBin.add(binItem);

    setCustomers(finalCustomers);
    setSuppliers(finalSuppliers);
    setPayments((prev) => prev.filter((p) => p.id !== id));
    setRecycleBin((prev) => [binItem, ...prev]);

    queueSync('DELETE', 'Payment', pay.id, null);
  };

  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const id = generateId('EXP');
    const newExpense: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
      id,
    };

    setExpenses((prev) => [...prev, newExpense]);

    db.expenses.add({ ...newExpense, isDeleted: false, version: 1 });
    queueSync('CREATE', 'Expense', id, newExpense);

    return newExpense;
  };

  const editExpense = (exp: Expense) => {
    const formatted: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
    };

    setExpenses((prev) => prev.map((item) => (item.id === exp.id ? formatted : item)));

    db.expenses.put({ ...formatted, isDeleted: false, version: 1 });
    queueSync('UPDATE', 'Expense', exp.id, formatted);
  };

  const deleteExpense = (id: string) => {
    const item = expenses.find((exp) => exp.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: generateId('REC'),
        originalId: item.id,
        name: `${item.category}: ₹${item.amount}`,
        module: 'Expense',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Vaibhav Patel',
        originalData: item,
      };

      db.expenses.update(id, { isDeleted: true });
      db.recycleBin.add(binItem);

      setExpenses((prev) => prev.filter((item) => item.id !== id));
      setRecycleBin((prev) => [binItem, ...prev]);

      queueSync('DELETE', 'Expense', id, null);
    }
  };

  // --- Recycle Bin Restoration / Permanent Deletion Actions ---

  const restoreRecord = (id: string) => {
    const item = recycleBin.find((r) => r.id === id);
    if (!item) return;

    // Restore in database
    if (item.module === 'Product') {
      db.products.update(item.originalId, { isDeleted: false });
      setProducts((prev) => [...prev, item.originalData]);
      queueSync('UPDATE', 'Product', item.originalId, item.originalData);
    } else if (item.module === 'Customer') {
      db.customers.update(item.originalId, { isDeleted: false });
      setCustomers((prev) => [...prev, item.originalData]);
      queueSync('UPDATE', 'Customer', item.originalId, item.originalData);
    } else if (item.module === 'Supplier') {
      db.suppliers.update(item.originalId, { isDeleted: false });
      setSuppliers((prev) => [...prev, item.originalData]);
      queueSync('UPDATE', 'Supplier', item.originalId, item.originalData);
    } else if (item.module === 'Invoice') {
      db.invoices.update(item.originalId, { isDeleted: false });
      setInvoices((prev) => [item.originalData, ...prev]);
      queueSync('UPDATE', 'Invoice', item.originalId, item.originalData);
    } else if (item.module === 'Quotation') {
      db.quotations.update(item.originalId, { isDeleted: false });
      setQuotations((prev) => [item.originalData, ...prev]);
      queueSync('UPDATE', 'Quotation', item.originalId, item.originalData);
    } else if (item.module === 'Purchase') {
      db.purchases.update(item.originalId, { isDeleted: false });
      setPurchases((prev) => [item.originalData, ...prev]);
      queueSync('UPDATE', 'Purchase', item.originalId, item.originalData);
    } else if (item.module === 'Payment') {
      db.payments.update(item.originalId, { isDeleted: false });
      setPayments((prev) => [item.originalData, ...prev]);
      queueSync('UPDATE', 'Payment', item.originalId, item.originalData);
    } else if (item.module === 'Expense') {
      db.expenses.update(item.originalId, { isDeleted: false });
      setExpenses((prev) => [item.originalData, ...prev]);
      queueSync('UPDATE', 'Expense', item.originalId, item.originalData);
    }

    db.recycleBin.delete(id);
    setRecycleBin((prev) => prev.filter((r) => r.id !== id));
  };

  const deletePermanently = (id: string) => {
    db.recycleBin.delete(id);
    setRecycleBin((prev) => prev.filter((r) => r.id !== id));
  };

  const restoreRecords = (ids: string[]) => {
    ids.forEach((id) => restoreRecord(id));
  };

  const deleteRecordsPermanently = (ids: string[]) => {
    ids.forEach((id) => deletePermanently(id));
  };

  const updateSettings = (updatedSettings: BusinessSettings) => {
    const formatted = {
      ...updatedSettings,
      businessName: toTitleCase(updatedSettings.businessName),
      ownerName: toTitleCase(updatedSettings.ownerName),
    };
    
    setSettings(formatted);
    localStorage.setItem('agribiz_settings', JSON.stringify(formatted));
    document.title = formatted.businessName || 'AgriBiz';

    db.settings.put({ ...formatted, id: 'business' });
    queueSync('UPDATE', 'Settings', 'business', formatted);
  };

  const resetToDefault = async () => {
    localStorage.removeItem('agribiz_products');
    localStorage.removeItem('agribiz_customers');
    localStorage.removeItem('agribiz_suppliers');
    localStorage.removeItem('agribiz_invoices');
    localStorage.removeItem('agribiz_quotations');
    localStorage.removeItem('agribiz_purchases');
    localStorage.removeItem('agribiz_payments');
    localStorage.removeItem('agribiz_settings');
    localStorage.removeItem('agribiz_expenses');
    localStorage.removeItem('agribiz_recycle_bin');

    await db.products.clear();
    await db.customers.clear();
    await db.suppliers.clear();
    await db.invoices.clear();
    await db.quotations.clear();
    await db.purchases.clear();
    await db.payments.clear();
    await db.expenses.clear();
    await db.recycleBin.clear();
    await db.settings.clear();
    await db.syncQueue.clear();

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
