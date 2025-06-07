import { z } from 'zod';

export const createBranchSchema = z.object({
  branchName: z.string().min(1, 'Branch name is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(1, 'Address is required'),
  staffName: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Inactive']).default('Active')
});

export const updateBranchSchema = createBranchSchema.partial();

export const updateBranchStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be either Active or Inactive'
  })
});
