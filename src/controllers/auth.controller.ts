import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: any;
}

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { user, token } = await authService.createUser(req.body, req.body.createdBy || '');

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userName, password } = req.body;
  const { user, token } = await authService.login(userName, password);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const users = await authService.getAllUsers();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await authService.getUserById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await authService.updateUser(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await authService.deleteUser(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully'
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await authService.getUserById(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});