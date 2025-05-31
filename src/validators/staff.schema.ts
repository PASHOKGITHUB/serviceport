import { z } from 'zod';

export const createStaffSchema = z.object({
  staffName: z.string().min(1, 'Staff name is required'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  role: z.enum(['Technician', 'Staff', 'Manager'], { required_error: 'Role is required' }),
  branch: z.string().min(1, 'Branch ID is required'),
  action: z.enum(['Active', 'Inactive']).default('Active')
});

export const updateStaffSchema = createStaffSchema.partial();