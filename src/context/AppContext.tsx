import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Customer, Supplier, Invoice, Purchase, Payment, BusinessSettings } from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialInvoices,
  initialPurchases,
  initialPayments,
  initialSettings,
} from '../utils/dummyData';

interface AppContextType {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchases: Purchase[];
  payments: Payment[];
  settings: BusinessSettings;
  currentTab: string;
  currentInvoiceId: string | null;
  currentPurchaseId: string | null;
  currentCustomerId: string | null;
  currentSupplierId: string | null;
  isCreatingInvoice: boolean;
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
  setViewPurchase: (id: string | null) => void;
  setViewCustomer: (id: string | null) => void;
  setViewSupplier: (id: string | null) => void;
  setIsCreatingInvoice: (val: boolean) => void;
  setIsEnteringPurchase: (val: boolean) => void;
  setIsEditingProduct: (product: Product | null) => void;
  setIsEditingCustomer: (customer: Customer | null) => void;
  setIsEditingSupplier: (supplier: Supplier | null) => void;

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
  deleteInvoice: (id: string) => void;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNumber'>) => void;
  deletePurchase: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id'>) => void;
  deletePayment: (id: string) => void;

  updateSettings: (settings: BusinessSettings) => void;
  resetToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage if exists, otherwise use initial mock data
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('agribiz_products');
    return local ? JSON.parse(local) : initialProducts;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem('agribiz_customers');
    return local ? JSON.parse(local) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const local = localStorage.getItem('agribiz_suppliers');
    return local ? JSON.parse(local) : initialSuppliers;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const local = localStorage.getItem('agribiz_invoices');
    return local ? JSON.parse(local) : initialInvoices;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const local = localStorage.getItem('agribiz_purchases');
    return local ? JSON.parse(local) : initialPurchases;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const local = localStorage.getItem('agribiz_payments');
    return local ? JSON.parse(local) : initialPayments;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const local = localStorage.getItem('agribiz_settings');
    return local ? JSON.parse(local) : initialSettings;
  });

  // UI State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentInvoiceId, setViewInvoice] = useState<string | null>(null);
  const [currentPurchaseId, setViewPurchase] = useState<string | null>(null);
  const [currentCustomerId, setViewCustomer] = useState<string | null>(null);
  const [currentSupplierId, setViewSupplier] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<boolean>(false);
  const [isEnteringPurchase, setIsEnteringPurchase] = useState<boolean>(false);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState<Customer | null>(null);
  const [isEditingSupplier, setIsEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    // Auto-clear toast after 3 seconds
    setTimeout(() => {
      setToast((curr) => curr && curr.message === message ? null : curr);
    }, 3000);
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
    localStorage.setItem('agribiz_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('agribiz_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('agribiz_settings', JSON.stringify(settings));
    // Apply body theme class
    document.body.className = settings.theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [settings]);

  // Actions
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...p,
      id: `P${Date.now().toString().slice(-4)}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const editProduct = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const newCustomer: Customer = {
      ...c,
      id: `C${Date.now().toString().slice(-4)}`,
      outstanding: c.outstanding || 0,
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const editCustomer = (c: Customer) => {
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? c : item)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  const addSupplier = (s: Omit<Supplier, 'id' | 'outstanding'> & { outstanding?: number }) => {
    const newSupplier: Supplier = {
      ...s,
      id: `S${Date.now().toString().slice(-4)}`,
      outstanding: s.outstanding || 0,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
  };

  const editSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
  };

  // Invoices (Sales)
  const addInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const count = invoices.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const invoiceNumber = `${settings.invoicePrefix}${formattedCount}`;
    const id = `INV-${Date.now().toString().slice(-4)}`;

    const newInvoice: Invoice = {
      ...inv,
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
        id: `PAY-${Date.now().toString().slice(-4)}`,
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
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    setInvoices((prev) => prev.filter((i) => i.id !== id));

    // Inventory effect: Restore stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const matchingItem = inv.items.find((item) => item.productId === p.id);
        if (matchingItem) {
          return {
            ...p,
            stock: p.stock + matchingItem.quantity,
          };
        }
        return p;
      })
    );

    // Customer effect: Revert outstanding balance
    setCustomers((prevCustomers) =>
      prevCustomers.map((cust) => {
        if (cust.id === inv.customerId) {
          return {
            ...cust,
            outstanding: cust.outstanding - inv.balanceDue,
          };
        }
        return cust;
      })
    );

    // Note: To keep things simple, we don't automatically delete the payment record
    // but the ledger remains clean since deleting invoices should be rare in practice.
  };

  // Purchases (Supplier Inward)
  const addPurchase = (pur: Omit<Purchase, 'id' | 'purchaseNumber'>) => {
    const count = purchases.length + 1;
    const formattedCount = count.toString().padStart(3, '0');
    const purchaseNumber = `PUR-${settings.invoicePrefix.replace('AB-', '')}${formattedCount}`;
    const id = `PUR-${Date.now().toString().slice(-4)}`;

    const newPurchase: Purchase = {
      ...pur,
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
        id: `PAY-${Date.now().toString().slice(-4)}`,
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
  };

  const deletePurchase = (id: string) => {
    const pur = purchases.find((p) => p.id === id);
    if (!pur) return;

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

  // Payments Ledger
  const addPayment = (pay: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...pay,
      id: `PAY-${Date.now().toString().slice(-4)}`,
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

  const deletePayment = (id: string) => {
    const pay = payments.find((p) => p.id === id);
    if (!pay) return;

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
    setSettings(s);
  };

  const resetToDefault = () => {
    localStorage.removeItem('agribiz_products');
    localStorage.removeItem('agribiz_customers');
    localStorage.removeItem('agribiz_suppliers');
    localStorage.removeItem('agribiz_invoices');
    localStorage.removeItem('agribiz_purchases');
    localStorage.removeItem('agribiz_payments');
    localStorage.removeItem('agribiz_settings');

    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setInvoices(initialInvoices);
    setPurchases(initialPurchases);
    setPayments(initialPayments);
    setSettings(initialSettings);

    setCurrentTab('dashboard');
    setViewInvoice(null);
    setViewPurchase(null);
    setViewCustomer(null);
    setViewSupplier(null);
    setIsCreatingInvoice(false);
    setIsEnteringPurchase(false);
    setIsEditingProduct(null);
    setIsEditingCustomer(null);
    setIsEditingSupplier(null);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        suppliers,
        invoices,
        purchases,
        payments,
        settings,
        currentTab,
        currentInvoiceId,
        currentPurchaseId,
        currentCustomerId,
        currentSupplierId,
        isCreatingInvoice,
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
        setViewPurchase,
        setViewCustomer,
        setViewSupplier,
        setIsCreatingInvoice,
        setIsEnteringPurchase,
        setIsEditingProduct,
        setIsEditingCustomer,
        setIsEditingSupplier,

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
        deleteInvoice,

        addPurchase,
        deletePurchase,

        addPayment,
        deletePayment,

        updateSettings,
        resetToDefault,
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
