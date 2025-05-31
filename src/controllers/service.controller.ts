import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/service.service';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: any;
}

const serviceService = new ServiceService();

export const createService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { service, customer } = await serviceService.createService(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    message: 'Service created successfully',
    data: {
      service,
      customer
    }
  });
});

export const getAllServices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const services = await serviceService.getAllServices(req.query);

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

export const getService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const service = await serviceService.getServiceById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

export const updateService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const service = await serviceService.updateService(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Service updated successfully',
    data: {
      service
    }
  });
});

export const updateServiceAction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { action } = req.body;
  const service = await serviceService.updateServiceAction(req.params.id, action, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Service action updated successfully',
    data: {
      service
    }
  });
});

export const assignTechnician = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { technicianId } = req.body;
  const service = await serviceService.assignTechnician(req.params.id, technicianId, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Technician assigned successfully',
    data: {
      service
    }
  });
});

export const deleteService = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await serviceService.deleteService(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Service deleted successfully'
  });
});

export const getServicesByStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const services = await serviceService.getServicesByStatus(req.params.status);

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

export const getServicesByTechnician = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const services = await serviceService.getServicesByTechnician(req.params.technicianId);

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

export const getServiceStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const stats = await serviceService.getServiceStats();

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

export const getServicesReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const report = await serviceService.getServicesReport(req.query);

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
});

export const updateServiceCost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { serviceCost } = req.body;
  const service = await serviceService.updateServiceCost(req.params.id, serviceCost, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Service cost updated successfully',
    data: {
      service
    }
  });
});

export const bulkUpdateServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { serviceIds, updateData } = req.body;
  const services = await serviceService.bulkUpdateServices(serviceIds, updateData, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Services updated successfully',
    data: {
      services
    }
  });
});