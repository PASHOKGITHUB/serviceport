import { Request, Response, NextFunction } from 'express';
import { StaffService } from '../services/staff.service';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: any;
}

const staffService = new StaffService();

export const createStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await staffService.createStaff(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    message: 'Staff created successfully',
    data: {
      staff
    }
  });
});

export const getAllStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const staff = await staffService.getAllStaff(req.query);

  res.status(200).json({
    status: 'success',
    results: staff.length,
    data: {
      staff
    }
  });
});

export const getStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const staff = await staffService.getStaffById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      staff
    }
  });
});

export const updateStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await staffService.updateStaff(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Staff updated successfully',
    data: {
      staff
    }
  });
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await staffService.deleteStaff(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Staff deleted successfully'
  });
});

export const getStaffByBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const staff = await staffService.getStaffByBranch(req.params.branchId);

  res.status(200).json({
    status: 'success',
    results: staff.length,
    data: {
      staff
    }
  });
});

export const getTechnicians = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const technicians = await staffService.getTechnicians();

  res.status(200).json({
    status: 'success',
    results: technicians.length,
    data: {
      technicians
    }
  });
});