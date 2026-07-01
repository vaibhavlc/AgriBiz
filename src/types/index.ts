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
  businessName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state?: string;
  invoicePrefix: string;
  financialYear: string;
  theme: 'light' | 'dark';
}
