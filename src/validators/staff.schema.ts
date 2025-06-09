// src/validators/staff.schema.ts

import { z } from 'zod';

export const createStaffSchema = z.object({
  staffName: z.string()
    .min(1, 'Staff name is required')
    .max(100, 'Staff name must be less than 100 characters')
    .trim(),
  contactNumber: z.string()
    .min(10, 'Contact number must be at least 10 digits')
    .max(15, 'Contact number must be less than 15 digits')
    .regex(/^\d+$/, 'Contact number must contain only digits')
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  role: z.enum(['Technician', 'Staff', 'Manager'], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be Technician, Staff, or Manager'
  }),
  branch: z.string()
    .min(1, 'Branch is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID'),
  address: z.string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  action: z.enum(['Active', 'Inactive']).optional().default('Active')
});

export const updateStaffSchema = z.object({
  staffName: z.string()
    .min(1, 'Staff name is required')
    .max(100, 'Staff name must be less than 100 characters')
    .trim()
    .optional(),
  contactNumber: z.string()
    .min(10, 'Contact number must be at least 10 digits')
    .max(15, 'Contact number must be less than 15 digits')
    .regex(/^\d+$/, 'Contact number must contain only digits')
    .trim()
    .optional(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .optional(),
  role: z.enum(['Technician', 'Staff', 'Manager'], {
    invalid_type_error: 'Role must be Technician, Staff, or Manager'
  }).optional(),
  branch: z.string()
    .min(1, 'Branch is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID')
    .optional(),
  address: z.string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters')
    .trim()
    .optional(),
  action: z.enum(['Active', 'Inactive']).optional()
});