import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: any;
}

const customerService = new CustomerService();

export const getAllCustomers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customers = await customerService.getAllCustomers(req.query);

  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: {
      customers
    }
  });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customer = await customerService.getCustomerById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

export const getCustomerByService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customer = await customerService.getCustomerByServiceId(req.params.serviceId);

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Customer updated successfully',
    data: {
      customer
    }
  });
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await customerService.deleteCustomer(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Customer deleted successfully'
  });
});

export const searchCustomers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { q } = req.query;
  const customers = await customerService.searchCustomers(q as string);

  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: {
      customers
    }
  });
});

export const getCustomersByBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customers = await customerService.getCustomersByBranch(req.params.branchId);

  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: {
      customers
    }
  });
});

export const getCustomerHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const history = await customerService.getCustomerHistory(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      history
    }
  });
});

export const getCustomerStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const stats = await customerService.getCustomerStats();

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const customer = await customerService.createCustomer(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    message: 'Customer created successfully',
    data: {
      customer
    }
  });
});