export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number; // Low stock threshold
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // GST percentage, e.g., 5, 12, 18, 28
  hsn?: string; // HSN code for GST billing
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  state?: string;
  gstin?: string;
  outstanding: number;
  allowedStaffActions?: string[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  outstanding: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Unit price
  discount: number; // Discount percentage (e.g. 5 for 5%)
  gstRate: number;
  gstAmount: number;
  subtotal: number; // (Price * Qty) - DiscountAmount
  total: number; // Subtotal + gstAmount
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  paymentMethod: string;
  referenceNumber?: string;  // UPI txn ID / Cheque No / Transfer ref
  dueDate?: string;          // Expected date to clear balance due
  notes?: string;
  showSignature?: boolean;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  subtotal: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Converted';
  convertedInvoiceId?: string;
  notes?: string;
}


export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Purchase price
  gstRate: number;
  gstAmount: number;
  subtotal: number;
  total: number;
  discount?: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  paymentMethod: string;
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  type: 'CustomerReceipt' | 'SupplierPayment';
  contactId: string; // Customer ID or Supplier ID
  contactName: string;
  amount: number;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNumber?: string;
  notes?: string;
}

export interface BusinessSettings {
  // Business Information
  businessName: string;
  ownerName: string;
  gstin: string;
  panNumber: string;
  businessType?: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;

  // Business Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  taluka?: string;
  district: string;
  state: string;
  pincode: string;

  // Branding
  logo?: string;
  watermarkLogo?: string;
  signature?: string;

  // Banking Details
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;

  // Invoice Configuration
  invoicePrefix: string;
  purchasePrefix: string;
  quotationPrefix: string;
  financialYear: string;
  defaultTerms?: string;
  invoiceTerms?: string;
  quotationTerms?: string;
  purchaseTerms?: string;
  footerMessage?: string;

  // Print Preferences
  showLogo: boolean;
  showGstin: boolean;
  showAddress: boolean;
  showContact: boolean;
  showBankDetails: boolean;
  showTerms: boolean;

  // Application Preferences
  theme: 'light' | 'dark' | 'system';
  currencySymbol: string;
  dateFormat: string;

  // Alert Settings
  showLowStockAlert?: boolean;
  showOutOfStockAlert?: boolean;

  // Legacy fallback to prevent TS issues in other files before refactoring
  address: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string; // e.g., 'Shop Rent', 'Light Bill', 'Tea Bills', 'Transportation', 'Maintenance', etc.
  payee: string; // To Whom Paid
  amount: number;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  status: 'Paid' | 'Due';
  dueDate?: string; // Optional due date if status is 'Due'
  referenceNumber?: string;
  notes?: string;
}

export interface RecycleBinItem {
  id: string;
  originalId: string;
  name: string;
  module: 'Product' | 'Customer' | 'Supplier' | 'Invoice' | 'Quotation' | 'Purchase' | 'Payment' | 'Expense';
  deletedAt: string;
  deletedBy: string;
  originalData: any;
}

export type UserRole = 'Owner' | 'Accounts' | 'Cashier';

export interface Company {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Future backend subscription placeholders
  plan?: string;
  subscriptionStatus?: 'Active' | 'Expired' | 'Trial';
  planExpiry?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  mobile: string;
  email?: string;
  password?: string;
  role: UserRole;
  customPermissions?: string[];
  status: 'Active' | 'Inactive';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  currentUserId: string;
  companyId: string;
  token: string;
  rememberMe: boolean;
}
