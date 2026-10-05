import type { TFunction } from 'i18next';

export function translateStatus(status: string | undefined | null, t: TFunction): string {
  if (!status) return '';
  const normalized = status.trim();
  switch (normalized) {
    case 'In Stock':
    case 'in_stock':
      return t('status.inStock', 'In Stock');
    case 'Low Stock':
    case 'low_stock':
      return t('status.lowStock', 'Low Stock');
    case 'Out of Stock':
    case 'out_of_stock':
      return t('status.outOfStock', 'Out of Stock');
    case 'Active':
    case 'active':
      return t('status.active', 'Active');
    case 'Inactive':
    case 'inactive':
    case 'Disabled':
    case 'disabled':
      return t('status.inactive', 'Inactive');
    case 'Paid':
    case 'paid':
      return t('status.paid', 'Paid');
    case 'Partial':
    case 'Partially Paid':
    case 'partial':
      return t('status.partial', 'Partial');
    case 'Unpaid':
    case 'unpaid':
      return t('status.unpaid', 'Unpaid');
    case 'Pending':
    case 'pending':
      return t('status.pending', 'Pending');
    case 'Overdue':
    case 'overdue':
      return t('status.overdue', 'Overdue');
    case 'Draft':
    case 'draft':
      return t('status.draft', 'Draft');
    case 'Sent':
    case 'sent':
      return t('status.sent', 'Sent');
    case 'Approved':
    case 'approved':
      return t('status.approved', 'Approved');
    case 'Converted':
    case 'converted':
      return t('status.converted', 'Converted');
    case 'Declined':
    case 'declined':
      return t('status.declined', 'Declined');
    case 'Completed':
    case 'completed':
      return t('status.completed', 'Completed');
    case 'Cancelled':
    case 'canceled':
    case 'cancelled':
      return t('status.cancelled', 'Cancelled');
    case 'CustomerReceipt':
      return t('payments.customerReceipt', 'Customer Receipt');
    case 'SupplierPayment':
      return t('payments.supplierPayment', 'Supplier Payment');
    default:
      return t(`status.${normalized}`, normalized);
  }
}

export function translatePaymentMethod(method: string | undefined | null, t: TFunction): string {
  if (!method) return '';
  const normalized = method.trim();
  switch (normalized) {
    case 'Cash':
      return t('paymentMethods.cash', 'Cash');
    case 'UPI':
    case 'UPI / GPay / PhonePe':
      return t('paymentMethods.upi', 'UPI / Online');
    case 'Bank Transfer':
    case 'Net Banking':
      return t('paymentMethods.bankTransfer', 'Bank Transfer');
    case 'Cheque':
      return t('paymentMethods.cheque', 'Cheque');
    default:
      return normalized;
  }
}
