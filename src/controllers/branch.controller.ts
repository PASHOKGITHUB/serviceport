import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../services/branch.service';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: any;
}

const branchService = new BranchService();

export const createBranch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const branch = await branchService.createBranch(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    message: 'Branch created successfully',
    data: {
      branch
    }
  });
});

export const getAllBranches = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const branches = await branchService.getAllBranches(req.query);

  res.status(200).json({
    status: 'success',
    results: branches.length,
    data: {
      branches
    }
  });
});

export const getBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const branch = await branchService.getBranchById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      branch
    }
  });
});

export const updateBranch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const branch = await branchService.updateBranch(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Branch updated successfully',
    data: {
      branch
    }
  });
});

export const updateBranchStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.body;
  const branch = await branchService.updateBranchStatus(req.params.id, status, req.user._id);

  res.status(200).json({
    status: 'success',
    message: `Branch status updated to ${status} successfully`,
    data: {
      branch
    }
  });
});


export const deleteBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await branchService.deleteBranch(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Branch deleted successfully'
  });
});

export const addStaffToBranch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const branch = await branchService.addStaffToBranch(req.params.branchId, req.params.staffId, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Staff added to branch successfully',
    data: {
      branch
    }
  });
});

export const removeStaffFromBranch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const branch = await branchService.removeStaffFromBranch(req.params.branchId, req.params.staffId, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Staff removed from branch successfully',
    data: {
      branch
    }
  });
});