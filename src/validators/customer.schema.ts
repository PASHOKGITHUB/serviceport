import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(1, 'Address is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  branchId: z.string().min(1, 'Branch ID is required')
});

export const updateCustomerSchema = createCustomerSchema.partial();