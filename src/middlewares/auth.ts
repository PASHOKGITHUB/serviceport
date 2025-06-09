// src/middlewares/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from './error';
import { AuthService } from '../services/auth.service';

interface AuthRequest extends Request {
  user?: any;
}

const authService = new AuthService();

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  
  // Use the unified method to get user from both collections
  const currentUser = await authService.getUnifiedUserById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// New middleware to restrict based on user type
export const restrictToUserType = (...userTypes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!userTypes.includes(req.user.userType)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};