import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage if exists, otherwise use initial mock data
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('agribiz_products');
    const raw = local ? JSON.parse(local) : initialProducts;
    return raw.map((p: any) => ({
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
    }));
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem('agribiz_customers');
    const raw = local ? JSON.parse(local) : initialCustomers;
    return raw.map((c: any) => ({
      ...c,
      name: toTitleCase(c.name),
    }));
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const local = localStorage.getItem('agribiz_suppliers');
    const raw = local ? JSON.parse(local) : initialSuppliers;
    return raw.map((s: any) => ({
      ...s,
      name: toTitleCase(s.name),
    }));
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const local = localStorage.getItem('agribiz_invoices');
    const raw = local ? JSON.parse(local) : initialInvoices;
    return raw.map((inv: any) => ({
      ...inv,
      customerName: toTitleCase(inv.customerName),
      items: (inv.items || []).map((item: any) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    }));
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const local = localStorage.getItem('agribiz_quotations');
    const raw = local ? JSON.parse(local) : [];
    return raw.map((q: any) => ({
      ...q,
      customerName: toTitleCase(q.customerName),
      items: (q.items || []).map((item: any) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    }));
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const local = localStorage.getItem('agribiz_purchases');
    const raw = local ? JSON.parse(local) : initialPurchases;
    return raw.map((pur: any) => ({
      ...pur,
      supplierName: toTitleCase(pur.supplierName),
      items: (pur.items || []).map((item: any) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    }));
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const local = localStorage.getItem('agribiz_payments');
    const raw = local ? JSON.parse(local) : initialPayments;
    return raw.map((pay: any) => ({
      ...pay,
      contactName: toTitleCase(pay.contactName),
    }));
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const local = localStorage.getItem('agribiz_settings');
    const raw = local ? { ...initialSettings, ...JSON.parse(local) } : initialSettings;
    return {
      ...raw,
      businessName: toTitleCase(raw.businessName),
      ownerName: toTitleCase(raw.ownerName),
    };
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const local = localStorage.getItem('agribiz_expenses');
    const raw = local ? JSON.parse(local) : initialExpenses;
    return raw.map((exp: any) => ({
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
    }));
  });

  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>(() => {
    const local = localStorage.getItem('agribiz_recycle_bin');
    return local ? JSON.parse(local) : [];
  });

  // UI State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentInvoiceId, setViewInvoice] = useState<string | null>(null);
  const [currentQuotationId, setViewQuotation] = useState<string | null>(null);
  const [currentPurchaseId, setViewPurchase] = useState<string | null>(null);
  const [currentCustomerId, setViewCustomer] = useState<string | null>(null);
  const [currentSupplierId, setViewSupplier] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<boolean>(false);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState<boolean>(false);
  const [isEnteringPurchase, setIsEnteringPurchase] = useState<boolean>(false);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState<Customer | null>(null);
  const [isEditingSupplier, setIsEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    // Auto-clear toast after 3 seconds
    setTimeout(() => {
      setToast((curr) => curr && curr.message === message ? null : curr);
    }, 3000);
  };

  const openNewPaymentForm = (preset?: { contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' }) => {
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
    setIsPaymentFormOpen(true);
  };

  const openEditPaymentForm = (pay: Payment) => {
    setEditingPaymentId(pay.id);
    setPaymentType(pay.type);
    setContactId(pay.contactId);
    setPaymentDate(pay.date);
    setAmount(pay.amount);
    setPaymentMethod(pay.paymentMethod as any);
    setReferenceNumber(pay.referenceNumber || '');
    setNotes(pay.notes || '');
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

    // Reset states
    setContactId('');
    setAmount(0);
    setReferenceNumber('');
    setNotes('');
    setIsPaymentFormOpen(false);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('agribiz_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('agribiz_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('agribiz_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('agribiz_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('agribiz_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('agribiz_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('agribiz_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('agribiz_settings', JSON.stringify(settings));
    // Apply body theme class
    document.body.className = settings.theme === 'dark' ? 'dark-theme' : 'light-theme';
    // Update browser tab title dynamically
    document.title = settings.businessName || 'AgriBiz';
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('agribiz_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('agribiz_recycle_bin', JSON.stringify(recycleBin));
  }, [recycleBin]);

  // Actions
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
      id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const editProduct = (p: Product) => {
    const formatted: Product = {
      ...p,
      name: toTitleCase(p.name),
      category: toTitleCase(p.category),
    };
    setProducts((prev) => prev.map((item) => (item.id === p.id ? formatted : item)));
  };

  const deleteProduct = (id: string) => {
    const item = products.find((p) => p.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalId: item.id,
        name: item.name,
        module: 'Product',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Kunal Chaudhari',
        originalData: item,
      };
      setRecycleBin((prev) => [binItem, ...prev]);
    }
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const newCustomer: Customer = {
      ...c,
      name: toTitleCase(c.name),
      id: `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      outstanding: c.outstanding || 0,
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const editCustomer = (c: Customer) => {
    const formatted: Customer = {
      ...c,
      name: toTitleCase(c.name),
    };
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? formatted : item)));
  };

  const deleteCustomer = (id: string) => {
    const item = customers.find((c) => c.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalId: item.id,
        name: item.name,
        module: 'Customer',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Kunal Chaudhari',
        originalData: item,
      };
      setRecycleBin((prev) => [binItem, ...prev]);
    }
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  const addSupplier = (s: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const newSupplier: Supplier = {
      ...s,
      name: toTitleCase(s.name),
      id: `S-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      outstanding: s.outstanding || 0,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
  };

  const editSupplier = (s: Supplier) => {
    const formatted: Supplier = {
      ...s,
      name: toTitleCase(s.name),
    };
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? formatted : item)));
  };

  const deleteSupplier = (id: string) => {
    const item = suppliers.find((s) => s.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalId: item.id,
        name: item.name,
        module: 'Supplier',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Kunal Chaudhari',
        originalData: item,
      };
      setRecycleBin((prev) => [binItem, ...prev]);
    }
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
  };

  // Invoices (Sales)
  const addInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const count = invoices.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const invoiceNumber = `${settings.invoicePrefix}${formattedCount}`;
    const id = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

    setInvoices((prev) => [newInvoice, ...prev]);

    // Inventory effect: deduct stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const matchingItem = inv.items.find((item) => item.productId === p.id);
        if (matchingItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - matchingItem.quantity),
          };
        }
        return p;
      })
    );

    // Customer effect: update outstanding balance
    setCustomers((prevCustomers) =>
      prevCustomers.map((cust) => {
        if (cust.id === inv.customerId) {
          return {
            ...cust,
            outstanding: cust.outstanding + inv.balanceDue,
          };
        }
        return cust;
      })
    );

    // Payments effect: Log payment if customer paid an amount
    if (inv.amountPaid > 0) {
      const newPayment: Payment = {
        id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: inv.date,
        type: 'CustomerReceipt',
        contactId: inv.customerId,
        contactName: inv.customerName,
        amount: inv.amountPaid,
        paymentMethod: inv.paymentMethod as any || 'UPI',
        notes: `Against invoice ${invoiceNumber}`,
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    return newInvoice;
  };

  const deleteInvoice = (id: string) => {
    console.log("deleteInvoice called with id:", id);
    const inv = invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) {
      throw new Error(`Invoice not found: ${id}`);
    }

    const binItem: RecycleBinItem = {
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalId: inv.id,
      name: inv.invoiceNumber,
      module: 'Invoice',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Kunal Chaudhari',
      originalData: inv,
    };
    setRecycleBin((prev) => [binItem, ...prev]);

    // 1. Remove invoice from invoices list state
    setInvoices((prev) => prev.filter((i) => i.id !== inv.id && i.invoiceNumber !== inv.invoiceNumber));

    // 2. Safely revert product stock quantities
    try {
      if (inv.items && Array.isArray(inv.items)) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => {
            const matchingItem = inv.items.find((item) => item && item.productId === p.id);
            if (matchingItem) {
              const qty = Number(matchingItem.quantity) || 0;
              return {
                ...p,
                stock: (Number(p.stock) || 0) + qty,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Error restoring stock on invoice delete:", err);
    }

    // 3. Safely revert customer outstanding balance
    try {
      if (inv.customerId) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((cust) => {
            if (cust.id === inv.customerId) {
              const balanceDue = Number(inv.balanceDue) || 0;
              return {
                ...cust,
                outstanding: (Number(cust.outstanding) || 0) - balanceDue,
              };
            }
            return cust;
          })
        );
      }
    } catch (err) {
      console.error("Error reverting customer outstanding on invoice delete:", err);
    }
  };

  const editInvoice = (updatedInvoice: Invoice) => {
    console.log("editInvoice called with invoice:", updatedInvoice);
    const oldInvoice = invoices.find((i) => i.id === updatedInvoice.id || i.invoiceNumber === updatedInvoice.invoiceNumber);
    if (!oldInvoice) {
      throw new Error(`Original invoice not found: ${updatedInvoice.invoiceNumber}`);
    }

    // 1. Revert old stock changes
    let revertedProducts = products;
    try {
      if (oldInvoice.items && Array.isArray(oldInvoice.items)) {
        revertedProducts = products.map((p) => {
          const matchingItem = oldInvoice.items.find((item) => item && item.productId === p.id);
          if (matchingItem) {
            const qty = Number(matchingItem.quantity) || 0;
            return {
              ...p,
              stock: (Number(p.stock) || 0) + qty,
            };
          }
          return p;
        });
      }
    } catch (err) {
      console.error("Error reverting old stock changes on edit:", err);
    }

    // 2. Revert old customer outstanding changes
    let revertedCustomers = customers;
    try {
      if (oldInvoice.customerId) {
        revertedCustomers = customers.map((cust) => {
          if (cust.id === oldInvoice.customerId) {
            const balanceDue = Number(oldInvoice.balanceDue) || 0;
            return {
              ...cust,
              outstanding: (Number(cust.outstanding) || 0) - balanceDue,
            };
          }
          return cust;
        });
      }
    } catch (err) {
      console.error("Error reverting customer balance on edit:", err);
    }

    // 3. Apply new stock changes
    let finalProducts = revertedProducts;
    try {
      if (updatedInvoice.items && Array.isArray(updatedInvoice.items)) {
        finalProducts = revertedProducts.map((p) => {
          const matchingItem = updatedInvoice.items.find((item) => item && item.productId === p.id);
          if (matchingItem) {
            const qty = Number(matchingItem.quantity) || 0;
            return {
              ...p,
              stock: Math.max(0, (Number(p.stock) || 0) - qty),
            };
          }
          return p;
        });
      }
    } catch (err) {
      console.error("Error applying new stock changes on edit:", err);
    }

    // 4. Apply new customer outstanding balance changes
    let finalCustomers = revertedCustomers;
    try {
      if (updatedInvoice.customerId) {
        finalCustomers = revertedCustomers.map((cust) => {
          if (cust.id === updatedInvoice.customerId) {
            const balanceDue = Number(updatedInvoice.balanceDue) || 0;
            return {
              ...cust,
              outstanding: (Number(cust.outstanding) || 0) + balanceDue,
            };
          }
          return cust;
        });
      }
    } catch (err) {
      console.error("Error applying new customer balance on edit:", err);
    }

    const formattedInvoice: Invoice = {
      ...updatedInvoice,
      customerName: toTitleCase(updatedInvoice.customerName),
      items: (updatedInvoice.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    // 5. Update state atomically
    setProducts(finalProducts);
    setCustomers(finalCustomers);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === oldInvoice.id || inv.invoiceNumber === oldInvoice.invoiceNumber ? formattedInvoice : inv))
    );
  };

  // Quotations
  const addQuotation = (q: Omit<Quotation, 'id' | 'quotationNumber'>): Quotation => {
    const count = quotations.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const quotationNumber = `QT-${formattedCount}`;
    const id = `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
  };

  const deleteQuotation = (id: string) => {
    const item = quotations.find((q) => q.id === id);
    if (item) {
      const binItem: RecycleBinItem = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalId: item.id,
        name: item.quotationNumber,
        module: 'Quotation',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Kunal Chaudhari',
        originalData: item,
      };
      setRecycleBin((prev) => [binItem, ...prev]);
    }
    setQuotations((prev) => prev.filter((item) => item.id !== id));
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

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? { ...q, status: 'Converted', convertedInvoiceId: newInvoice.id }
          : q
      )
    );

    return newInvoice.id;
  };

  // Purchases (Supplier Inward)
  const addPurchase = (pur: Omit<Purchase, 'id' | 'purchaseNumber'>): Purchase => {
    const count = purchases.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const purchaseNumber = `PUR-${settings.invoicePrefix.replace('AB-', '')}${formattedCount}`;
    const id = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

    setPurchases((prev) => [newPurchase, ...prev]);

    // Inventory effect: Add stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const matchingItem = pur.items.find((item) => item.productId === p.id);
        if (matchingItem) {
          return {
            ...p,
            stock: p.stock + matchingItem.quantity,
          };
        }
        return p;
      })
    );

    // Supplier effect: update outstanding balance
    setSuppliers((prevSuppliers) =>
      prevSuppliers.map((supp) => {
        if (supp.id === pur.supplierId) {
          return {
            ...supp,
            outstanding: supp.outstanding + pur.balanceDue,
          };
        }
        return supp;
      })
    );

    // Payments effect: Log payment if supplier was paid
    if (pur.amountPaid > 0) {
      const newPayment: Payment = {
        id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: pur.date,
        type: 'SupplierPayment',
        contactId: pur.supplierId,
        contactName: pur.supplierName,
        amount: pur.amountPaid,
        paymentMethod: pur.paymentMethod as any || 'Bank Transfer',
        notes: `Against bill ${purchaseNumber}`,
      };
      setPayments((prev) => [newPayment, ...prev]);
    }
    return newPurchase;
  };

  const deletePurchase = (id: string) => {
    const pur = purchases.find((p) => p.id === id);
    if (!pur) return;

    const binItem: RecycleBinItem = {
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalId: pur.id,
      name: pur.purchaseNumber,
      module: 'Purchase',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Kunal Chaudhari',
      originalData: pur,
    };
    setRecycleBin((prev) => [binItem, ...prev]);

    setPurchases((prev) => prev.filter((p) => p.id !== id));

    // Inventory effect: Revert stock increase
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const matchingItem = pur.items.find((item) => item.productId === p.id);
        if (matchingItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - matchingItem.quantity),
          };
        }
        return p;
      })
    );

    // Supplier effect: Revert outstanding balance
    setSuppliers((prevSuppliers) =>
      prevSuppliers.map((supp) => {
        if (supp.id === pur.supplierId) {
          return {
            ...supp,
            outstanding: supp.outstanding - pur.balanceDue,
          };
        }
        return supp;
      })
    );
  };

  const editPurchase = (updatedPurchase: Purchase) => {
    const oldPurchase = purchases.find((p) => p.id === updatedPurchase.id || p.purchaseNumber === updatedPurchase.purchaseNumber);
    if (!oldPurchase) {
      throw new Error(`Original purchase not found: ${updatedPurchase.purchaseNumber}`);
    }

    // 1. Revert old stock changes (deduct the stock added by the old purchase)
    let revertedProducts = products;
    try {
      if (oldPurchase.items && Array.isArray(oldPurchase.items)) {
        revertedProducts = products.map((p) => {
          const matchingItem = oldPurchase.items.find((item) => item && item.productId === p.id);
          if (matchingItem) {
            const qty = Number(matchingItem.quantity) || 0;
            return {
              ...p,
              stock: Math.max(0, (Number(p.stock) || 0) - qty),
            };
          }
          return p;
        });
      }
    } catch (err) {
      console.error("Error reverting stock on purchase edit:", err);
    }

    // 2. Revert old supplier outstanding changes (deduct the outstanding from the old purchase)
    let revertedSuppliers = suppliers;
    try {
      if (oldPurchase.supplierId) {
        revertedSuppliers = suppliers.map((supp) => {
          if (supp.id === oldPurchase.supplierId) {
            const balanceDue = Number(oldPurchase.balanceDue) || 0;
            return {
              ...supp,
              outstanding: (Number(supp.outstanding) || 0) - balanceDue,
            };
          }
          return supp;
        });
      }
    } catch (err) {
      console.error("Error reverting supplier balance on purchase edit:", err);
    }

    // 3. Apply new stock changes (add stock from the updated purchase)
    let finalProducts = revertedProducts;
    try {
      if (updatedPurchase.items && Array.isArray(updatedPurchase.items)) {
        finalProducts = revertedProducts.map((p) => {
          const matchingItem = updatedPurchase.items.find((item) => item && item.productId === p.id);
          if (matchingItem) {
            const qty = Number(matchingItem.quantity) || 0;
            return {
              ...p,
              stock: (Number(p.stock) || 0) + qty,
            };
          }
          return p;
        });
      }
    } catch (err) {
      console.error("Error applying new stock changes on purchase edit:", err);
    }

    // 4. Apply new supplier outstanding changes (add outstanding from the updated purchase)
    let finalSuppliers = revertedSuppliers;
    try {
      if (updatedPurchase.supplierId) {
        finalSuppliers = revertedSuppliers.map((supp) => {
          if (supp.id === updatedPurchase.supplierId) {
            const balanceDue = Number(updatedPurchase.balanceDue) || 0;
            return {
              ...supp,
              outstanding: (Number(supp.outstanding) || 0) + balanceDue,
            };
          }
          return supp;
        });
      }
    } catch (err) {
      console.error("Error applying supplier balance on purchase edit:", err);
    }

    const formattedPurchase: Purchase = {
      ...updatedPurchase,
      supplierName: toTitleCase(updatedPurchase.supplierName),
      items: (updatedPurchase.items || []).map((item) => ({
        ...item,
        productName: toTitleCase(item.productName),
      })),
    };

    // 5. Update state atomically
    setProducts(finalProducts);
    setSuppliers(finalSuppliers);
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === oldPurchase.id || pur.purchaseNumber === oldPurchase.purchaseNumber ? formattedPurchase : pur))
    );
  };

  // Payments Ledger
  const addPayment = (pay: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...pay,
      contactName: toTitleCase(pay.contactName),
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Outstanding updates
    if (pay.type === 'CustomerReceipt') {
      setCustomers((prevCustomers) =>
        prevCustomers.map((cust) => {
          if (cust.id === pay.contactId) {
            return {
              ...cust,
              outstanding: cust.outstanding - pay.amount,
            };
          }
          return cust;
        })
      );
    } else {
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((supp) => {
          if (supp.id === pay.contactId) {
            return {
              ...supp,
              outstanding: supp.outstanding - pay.amount,
            };
          }
          return supp;
        })
      );
    }
  };

  const editPayment = (updatedPayment: Payment) => {
    const oldPayment = payments.find((p) => p.id === updatedPayment.id);
    if (!oldPayment) return;

    // Revert old outstanding
    let revertedCustomers = customers;
    let revertedSuppliers = suppliers;

    if (oldPayment.type === 'CustomerReceipt') {
      revertedCustomers = customers.map((cust) => {
        if (cust.id === oldPayment.contactId) {
          return {
            ...cust,
            outstanding: cust.outstanding + oldPayment.amount,
          };
        }
        return cust;
      });
    } else {
      revertedSuppliers = suppliers.map((supp) => {
        if (supp.id === oldPayment.contactId) {
          return {
            ...supp,
            outstanding: supp.outstanding + oldPayment.amount,
          };
        }
        return supp;
      });
    }

    // Apply new outstanding
    if (updatedPayment.type === 'CustomerReceipt') {
      revertedCustomers = revertedCustomers.map((cust) => {
        if (cust.id === updatedPayment.contactId) {
          return {
            ...cust,
            outstanding: cust.outstanding - updatedPayment.amount,
          };
        }
        return cust;
      });
    } else {
      revertedSuppliers = revertedSuppliers.map((supp) => {
        if (supp.id === updatedPayment.contactId) {
          return {
            ...supp,
            outstanding: supp.outstanding - updatedPayment.amount,
          };
        }
        return supp;
      });
    }

    const formattedPayment: Payment = {
      ...updatedPayment,
      contactName: toTitleCase(updatedPayment.contactName),
    };

    setCustomers(revertedCustomers);
    setSuppliers(revertedSuppliers);
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? formattedPayment : p))
    );
  };

  const deletePayment = (id: string) => {
    const pay = payments.find((p) => p.id === id);
    if (!pay) return;

    const binItem: RecycleBinItem = {
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalId: pay.id,
      name: `Payment - ₹${pay.amount} (${pay.paymentMethod})`,
      module: 'Payment',
      deletedAt: new Date().toISOString(),
      deletedBy: settings.ownerName || 'Kunal Chaudhari',
      originalData: pay,
    };
    setRecycleBin((prev) => [binItem, ...prev]);

    setPayments((prev) => prev.filter((p) => p.id !== id));

    // Revert outstanding
    if (pay.type === 'CustomerReceipt') {
      setCustomers((prevCustomers) =>
        prevCustomers.map((cust) => {
          if (cust.id === pay.contactId) {
            return {
              ...cust,
              outstanding: cust.outstanding + pay.amount,
            };
          }
          return cust;
        })
      );
    } else {
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((supp) => {
          if (supp.id === pay.contactId) {
            return {
              ...supp,
              outstanding: supp.outstanding + pay.amount,
            };
          }
          return supp;
        })
      );
    }
  };

  const updateSettings = (s: BusinessSettings) => {
    const formatted: BusinessSettings = {
      ...s,
      businessName: toTitleCase(s.businessName),
      ownerName: toTitleCase(s.ownerName),
    };
    setSettings(formatted);
  };

  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
      id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const editExpense = (exp: Expense) => {
    const formatted: Expense = {
      ...exp,
      payee: toTitleCase(exp.payee),
      category: toTitleCase(exp.category),
    };
    setExpenses((prev) => prev.map((item) => (item.id === exp.id ? formatted : item)));
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (exp) {
      const binItem: RecycleBinItem = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalId: exp.id,
        name: `${exp.category} - ${exp.payee}`,
        module: 'Expense',
        deletedAt: new Date().toISOString(),
        deletedBy: settings.ownerName || 'Kunal Chaudhari',
        originalData: exp,
      };
      setRecycleBin((prev) => [binItem, ...prev]);
    }
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const restoreRecord = (id: string) => {
    const item = recycleBin.find((r) => r.id === id);
    if (!item) return;

    if (item.module === 'Product') {
      setProducts((prev) => [...prev, item.originalData]);
    } else if (item.module === 'Customer') {
      setCustomers((prev) => [...prev, item.originalData]);
    } else if (item.module === 'Supplier') {
      setSuppliers((prev) => [...prev, item.originalData]);
    } else if (item.module === 'Invoice') {
      setInvoices((prev) => [item.originalData, ...prev]);
    } else if (item.module === 'Quotation') {
      setQuotations((prev) => [item.originalData, ...prev]);
    } else if (item.module === 'Purchase') {
      setPurchases((prev) => [item.originalData, ...prev]);
    } else if (item.module === 'Payment') {
      setPayments((prev) => [item.originalData, ...prev]);
    } else if (item.module === 'Expense') {
      setExpenses((prev) => [item.originalData, ...prev]);
    }

    setRecycleBin((prev) => prev.filter((r) => r.id !== id));
  };

  const deletePermanently = (id: string) => {
    setRecycleBin((prev) => prev.filter((r) => r.id !== id));
  };

  const restoreRecords = (ids: string[]) => {
    const itemsToRestore = recycleBin.filter((r) => ids.includes(r.id));
    
    const productsToRestore: Product[] = [];
    const customersToRestore: Customer[] = [];
    const suppliersToRestore: Supplier[] = [];
    const invoicesToRestore: Invoice[] = [];
    const quotationsToRestore: Quotation[] = [];
    const purchasesToRestore: Purchase[] = [];
    const paymentsToRestore: Payment[] = [];
    const expensesToRestore: Expense[] = [];

    itemsToRestore.forEach((item) => {
      if (item.module === 'Product') productsToRestore.push(item.originalData);
      else if (item.module === 'Customer') customersToRestore.push(item.originalData);
      else if (item.module === 'Supplier') suppliersToRestore.push(item.originalData);
      else if (item.module === 'Invoice') invoicesToRestore.push(item.originalData);
      else if (item.module === 'Quotation') quotationsToRestore.push(item.originalData);
      else if (item.module === 'Purchase') purchasesToRestore.push(item.originalData);
      else if (item.module === 'Payment') paymentsToRestore.push(item.originalData);
      else if (item.module === 'Expense') expensesToRestore.push(item.originalData);
    });

    if (productsToRestore.length > 0) setProducts((prev) => [...prev, ...productsToRestore]);
    if (customersToRestore.length > 0) setCustomers((prev) => [...prev, ...customersToRestore]);
    if (suppliersToRestore.length > 0) setSuppliers((prev) => [...prev, ...suppliersToRestore]);
    if (invoicesToRestore.length > 0) setInvoices((prev) => [...invoicesToRestore, ...prev]);
    if (quotationsToRestore.length > 0) setQuotations((prev) => [...quotationsToRestore, ...prev]);
    if (purchasesToRestore.length > 0) setPurchases((prev) => [...purchasesToRestore, ...prev]);
    if (paymentsToRestore.length > 0) setPayments((prev) => [...paymentsToRestore, ...prev]);
    if (expensesToRestore.length > 0) setExpenses((prev) => [...expensesToRestore, ...prev]);

    setRecycleBin((prev) => prev.filter((r) => !ids.includes(r.id)));
  };

  const deleteRecordsPermanently = (ids: string[]) => {
    setRecycleBin((prev) => prev.filter((r) => !ids.includes(r.id)));
  };

  const resetToDefault = () => {
    localStorage.removeItem('agribiz_products');
    localStorage.removeItem('agribiz_customers');
    localStorage.removeItem('agribiz_suppliers');
    localStorage.removeItem('agribiz_invoices');
    localStorage.removeItem('agribiz_quotations');
    localStorage.removeItem('agribiz_purchases');
    localStorage.removeItem('agribiz_payments');
    localStorage.removeItem('agribiz_settings');
    localStorage.removeItem('agribiz_expenses');

    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setInvoices(initialInvoices);
    setQuotations([]);
    setPurchases(initialPurchases);
    setPayments(initialPayments);
    setSettings(initialSettings);
    setExpenses(initialExpenses);

    setCurrentTab('dashboard');
    setViewInvoice(null);
    setViewQuotation(null);
    setViewPurchase(null);
    setViewCustomer(null);
    setViewSupplier(null);
    setIsCreatingInvoice(false);
    setIsCreatingQuotation(false);
    setIsEnteringPurchase(false);
    setIsEditingProduct(null);
    setIsEditingCustomer(null);
    setIsEditingSupplier(null);
    setSalesActiveTab('invoices');
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
