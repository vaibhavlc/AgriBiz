import type { UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Owner: ['*'],

  Accounts: [
    'dashboard',
    'purchases',
    'inventory',
    'customers',
    'suppliers',
    'payments',
    'expenses',
    'reports',
  ],

  Cashier: [
    'dashboard',
    'sales',
    'inventory',
    'payments',
    'customers',
  ],
};

export const ALL_PAGE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard Overview', description: 'View business stats & key metrics' },
  { id: 'sales', label: 'Sales Invoices', description: 'Create and manage customer invoices' },
  { id: 'purchases', label: 'Purchases Ledger', description: 'Record supplier purchases & stock entry' },
  { id: 'inventory', label: 'Inventory Stock', description: 'Product catalog & stock adjustments' },
  { id: 'customers', label: 'Customers List', description: 'Customer directory & outstanding ledgers' },
  { id: 'suppliers', label: 'Suppliers List', description: 'Supplier directory & payables' },
  { id: 'payments', label: 'Payments Book', description: 'Record incoming & outgoing payments' },
  { id: 'expenses', label: 'Expenses Book', description: 'Track store expenses & billings' },
  { id: 'reports', label: 'Business Reports', description: 'Sales, tax, profit & loss reports' },
  { id: 'recycle', label: 'Recycle Bin', description: 'Restore or permanently delete items' },
  { id: 'settings', label: 'Store Settings', description: 'Manage business profile & staff users' },
];

/**
 * Evaluates whether a user possesses a required feature/tab permission.
 * Supports role defaults as well as custom user-specific permission overrides.
 */
export const hasPermission = (
  permission: string,
  role: UserRole | undefined | null,
  customPermissions?: string[]
): boolean => {
  if (!role) return false;
  if (role === 'Owner') return true;

  // Custom user permissions override
  if (customPermissions && Array.isArray(customPermissions) && customPermissions.length > 0) {
    if (customPermissions.includes('*')) return true;
    return customPermissions.includes(permission);
  }

  // Fallback to default role permissions
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.includes(permission);
};
