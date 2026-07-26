import { z } from 'zod';

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Owner', 'Accounts', 'Cashier']).optional(),
});

export const resetPasswordSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
});
