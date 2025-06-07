import { z } from 'zod';

const productDetailsSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  brand: z.string().min(1, 'Brand is required'),
  type: z.string().min(1, 'Type is required'),
  productIssue: z.string().min(1, 'Product issue is required')
});

export const createServiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerContactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  location: z.string().min(1, 'Location is required'),
  serviceCost: z.number().min(0, 'Service cost must be positive').optional(),
  productDetails: z.array(productDetailsSchema).min(1, 'At least one product is required'),
  branchId: z.string().min(1, 'Branch ID is required')
});

export const updateServiceSchema = z.object({
  technician: z.string().optional(),
  action: z.enum([
    'Received',
    'Assigned to Technician',
    'Under Inspection',
    'Waiting for Customer Approval',
    'Approved',
    'In Service',
    'Finished',
    'Delivered',
    'Completed',
    'Cancelled'
  ]).optional(),
  serviceCost: z.number().min(0).optional(),
  deliveredDate: z.string().datetime().optional()
});

export const updateServiceActionSchema = z.object({
  action: z.enum([
    'Received',
    'Assigned to Technician',
    'Under Inspection',
    'Waiting for Customer Approval',
    'Approved',
    'In Service',
    'Finished',
    'Delivered',
    'Completed',
    'Cancelled'
  ]),
  cancellationReason: z.string().optional()
}).refine((data) => {
  // If action is 'Cancelled', cancellationReason must be provided
  if (data.action === 'Cancelled') {
    return data.cancellationReason && data.cancellationReason.trim().length > 0;
  }
  return true;
}, {
  message: 'Cancellation reason is required when action is set to Cancelled',
  path: ['cancellationReason']
});


export const updateServiceCostSchema = z.object({
  serviceCost: z.number().min(0, 'Service cost must be positive')
});

export const bulkUpdateServicesSchema = z.object({
  serviceIds: z.array(z.string().min(1, 'Service ID is required')).min(1, 'At least one service ID is required'),
  updateData: z.object({
    action: z.enum([
      'Received',
      'Assigned to Technician',
      'Under Inspection',
      'Waiting for Customer Approval',
      'Approved',
      'In Service',
      'Finished',
      'Delivered',
      'Completed',
      'Cancelled'
    ]).optional(),
    serviceCost: z.number().min(0).optional()
  })
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1, 'Technician ID is required')
});