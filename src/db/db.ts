import Dexie, { type Table } from 'dexie';
import type {
  Product,
  Customer,
  Supplier,
  Invoice,
  Quotation,
  Purchase,
  Payment,
  Expense,
  RecycleBinItem,
  BusinessSettings,
  User,
} from '../types';

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: 'Product' | 'Customer' | 'Supplier' | 'Invoice' | 'Quotation' | 'Purchase' | 'Payment' | 'Expense' | 'Settings';
  recordId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  nextRetryAt?: number;
  lastError?: string;
}

export class AgriBizDatabase extends Dexie {
  products!: Table<Product & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  customers!: Table<Customer & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  suppliers!: Table<Supplier & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  invoices!: Table<Invoice & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  quotations!: Table<Quotation & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  purchases!: Table<Purchase & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  payments!: Table<Payment & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  expenses!: Table<Expense & { isDeleted?: boolean; deletedAt?: string; version?: number; deviceId?: string; createdBy?: string; updatedBy?: string }, string>;
  recycleBin!: Table<RecycleBinItem, string>;
  settings!: Table<BusinessSettings & { id: string }, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  users!: Table<User & { id: string }, string>;

  constructor() {
    super('AgriBizDatabase');
    this.version(1).stores({
      products: 'id, name, sku, category, isDeleted',
      customers: 'id, name, phone, isDeleted',
      suppliers: 'id, name, phone, isDeleted',
      invoices: 'id, invoiceNumber, customerId, date, isDeleted',
      quotations: 'id, quotationNumber, customerId, date, isDeleted',
      purchases: 'id, purchaseNumber, supplierId, date, isDeleted',
      payments: 'id, date, type, contactId, isDeleted',
      expenses: 'id, date, category, status, isDeleted',
      recycleBin: 'id, originalId, module, deletedAt',
      settings: 'id',
      syncQueue: '++id, module, recordId, action, timestamp',
    });
    this.version(2).stores({
      users: 'id, name, role, status, pin'
    });
  }

  async clearAllLocalData() {
    await Promise.all([
      this.products.clear(),
      this.customers.clear(),
      this.suppliers.clear(),
      this.invoices.clear(),
      this.quotations.clear(),
      this.purchases.clear(),
      this.payments.clear(),
      this.expenses.clear(),
      this.recycleBin.clear(),
      this.settings.clear(),
      this.syncQueue.clear(),
      this.users.clear(),
    ]);
  }
}

export const db = new AgriBizDatabase();
