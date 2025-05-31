import { z } from 'zod';

export const createAuthSchema = z.object({
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'staff'], { required_error: 'Role is required' })
});

export const loginSchema = z.object({
  userName: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});