import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Customer, Supplier, Invoice, Purchase, Payment, BusinessSettings, Expense } from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialInvoices,
  initialPurchases,
  initialPayments,
  initialSettings,
  initialExpenses,
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
  editInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

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

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const local = localStorage.getItem('agribiz_expenses');
    return local ? JSON.parse(local) : initialExpenses;
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

  const [paymentFormPreset, setPaymentFormPreset] = useState<{ contactId: string; type: 'CustomerReceipt' | 'SupplierPayment' } | null>(null);
  const [salesFormPresetCustomerId, setSalesFormPresetCustomerId] = useState<string | null>(null);
  const [purchaseFormPresetSupplierId, setPurchaseFormPresetSupplierId] = useState<string | null>(null);

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

  useEffect(() => {
    localStorage.setItem('agribiz_expenses', JSON.stringify(expenses));
  }, [expenses]);

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
    console.log("deleteInvoice called with id:", id);
    const inv = invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) {
      throw new Error(`Invoice not found: ${id}`);
    }

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

    // 5. Update state atomically
    setProducts(finalProducts);
    setCustomers(finalCustomers);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === oldInvoice.id || inv.invoiceNumber === oldInvoice.invoiceNumber ? updatedInvoice : inv))
    );
  };

  // Purchases (Supplier Inward)
  const addPurchase = (pur: Omit<Purchase, 'id' | 'purchaseNumber'>): Purchase => {
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
    return newPurchase;
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

    // 5. Update state atomically
    setProducts(finalProducts);
    setSuppliers(finalSuppliers);
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === oldPurchase.id || pur.purchaseNumber === oldPurchase.purchaseNumber ? updatedPurchase : pur))
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

    setCustomers(revertedCustomers);
    setSuppliers(revertedSuppliers);
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
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

  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...exp,
      id: `EXP-${Date.now().toString().slice(-4)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const editExpense = (exp: Expense) => {
    setExpenses((prev) => prev.map((item) => (item.id === exp.id ? exp : item)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const resetToDefault = () => {
    localStorage.removeItem('agribiz_products');
    localStorage.removeItem('agribiz_customers');
    localStorage.removeItem('agribiz_suppliers');
    localStorage.removeItem('agribiz_invoices');
    localStorage.removeItem('agribiz_purchases');
    localStorage.removeItem('agribiz_payments');
    localStorage.removeItem('agribiz_settings');
    localStorage.removeItem('agribiz_expenses');

    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setInvoices(initialInvoices);
    setPurchases(initialPurchases);
    setPayments(initialPayments);
    setSettings(initialSettings);
    setExpenses(initialExpenses);

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
        editInvoice,
        deleteInvoice,

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
