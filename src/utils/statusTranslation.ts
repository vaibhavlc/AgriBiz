import type { TFunction } from 'i18next';

export const translateStatus = (t: TFunction, status: string | undefined | null): string => {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  
  const statusKeys: Record<string, string> = {
    paid: 'status.paid',
    pending: 'status.pending',
    partially_paid: 'status.partiallyPaid',
    partial: 'status.partiallyPaid',
    cancelled: 'status.cancelled',
    draft: 'status.draft',
    due: 'status.due',
    overdue: 'status.overdue',
    in_stock: 'status.inStock',
    low_stock: 'status.lowStock',
    out_of_stock: 'status.outOfStock',
    active: 'status.active',
    inactive: 'status.inactive',
    completed: 'status.completed',
    received: 'status.received',
    sent: 'status.sent',
    verified: 'status.verified',
    unverified: 'status.unverified',
    enabled: 'status.enabled',
    disabled: 'status.disabled',
    success: 'status.success',
    failed: 'status.failed'
  };

  const key = statusKeys[normalized];
  if (key) {
    return t(key, status);
  }
  return status;
};

export const translatePaymentMethod = (t: TFunction, method: string | undefined | null): string => {
  if (!method) return '';
  const normalized = method.toLowerCase().replace(/\s+/g, '_');

  const methodKeys: Record<string, string> = {
    cash: 'paymentMethods.cash',
    upi: 'paymentMethods.upi',
    bank_transfer: 'paymentMethods.bankTransfer',
    bank: 'paymentMethods.bankTransfer',
    cheque: 'paymentMethods.cheque',
    card: 'paymentMethods.card',
    net_banking: 'paymentMethods.netBanking',
    online: 'paymentMethods.online',
    credit: 'paymentMethods.credit'
  };

  const key = methodKeys[normalized];
  if (key) {
    return t(key, method);
  }
  return method;
};

export const translateCategory = (t: TFunction, category: string | undefined | null): string => {
  if (!category) return '';
  const normalized = category.toLowerCase().replace(/\s+/g, '_');

  const categoryKeys: Record<string, string> = {
    fertilizer: 'categories.fertilizer',
    fertilizers: 'categories.fertilizer',
    pesticide: 'categories.pesticide',
    pesticides: 'categories.pesticide',
    seeds: 'categories.seeds',
    seed: 'categories.seeds',
    machinery: 'categories.machinery',
    tools: 'categories.tools',
    irrigation: 'categories.irrigation',
    animal_feed: 'categories.animalFeed',
    bio_fertilizer: 'categories.bioFertilizer',
    organic: 'categories.organic',
    general: 'categories.general',
    other: 'categories.other'
  };

  const key = categoryKeys[normalized];
  if (key) {
    return t(key, category);
  }
  return category;
};

export const translateRole = (t: TFunction, role: string | undefined | null): string => {
  if (!role) return '';
  const normalized = role.toLowerCase().replace(/\s+/g, '_');

  const roleKeys: Record<string, string> = {
    owner: 'roles.owner',
    admin: 'roles.admin',
    manager: 'roles.manager',
    biller: 'roles.biller',
    salesman: 'roles.salesman',
    staff: 'roles.staff',
    worker: 'roles.worker'
  };

  const key = roleKeys[normalized];
  if (key) {
    return t(key, role);
  }
  return role;
};
