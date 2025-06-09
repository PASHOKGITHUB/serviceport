// src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import { Auth, IAuth } from '../models/auth.model';
import { Staff, IStaff } from '../models/staff.model';
import { AppError } from '../middlewares/error';
import mongoose from 'mongoose';

interface UnifiedUser {
  _id: string;
  userName?: string; // For admin
  contactNumber?: string; // For staff
  staffName?: string; // For staff
  role: string;
  userType: 'admin' | 'staff';
  branch?: mongoose.Types.ObjectId; // Only for staff
}

export class AuthService {
  private signToken(id: string): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRE;
    
    if (!secret) {
      throw new AppError('JWT_SECRET is not defined in environment variables', 500);
    }
    
    if (!expiresIn) {
      throw new AppError('JWT_EXPIRE is not defined in environment variables', 500);
    }
    
    return jwt.sign(
      { id }, 
      secret as string, 
      { expiresIn: expiresIn as string }
    );
  }

  async createUser(userData: any, createdBy: string): Promise<{ user: Partial<IAuth>; token: string }> {
    userData.createdBy = createdBy;
    const newUser = await Auth.create(userData);
    const token = this.signToken((newUser._id as mongoose.Types.ObjectId).toString());
    
    // Remove password from output
    const userObj = newUser.toObject();
    const { password, ...userWithoutPassword } = userObj;
    
    return { user: userWithoutPassword, token };
  }

  // Unified login for both admin and staff
  async login(userName: string, password: string): Promise<{ user: UnifiedUser; token: string }> {
    console.log(`Login attempt for: ${userName}`);
    let user: (IAuth & { userType?: string }) | (IStaff & { userType?: string }) | null = null;
    let userType: 'admin' | 'staff' | null = null; // Initialize with null


    // First, try to find in Admin collection
    const adminUser = await Auth.findOne({ userName }).select('+password');
    
    if (adminUser) {
    console.log('Admin user found:', adminUser.userName); // Debug log
    if (adminUser.password && (await adminUser.correctPassword(password, adminUser.password))) {
      user = adminUser;
      userType = 'admin';
    }
  } else {
    console.log('No admin found, checking staff...'); // Debug log
  }

  // Try to find in Staff collection
  const staffUser = await Staff.findOne({ 
    contactNumber: userName,
    action: 'Active'
  }).select('+password').populate('branch', 'branchName location');

  if (staffUser) {
    console.log('Staff user found:', staffUser.contactNumber); // Debug log
    if (staffUser.password) {
      const isPasswordCorrect = await staffUser.correctPassword(password, staffUser.password);
      console.log('Password check result:', isPasswordCorrect); // Debug log
      if (isPasswordCorrect) {
        user = staffUser;
        userType = 'staff';
      }
    }
  }

  if (!user || !userType) {
    console.log('Login failed - no valid user found or password mismatch'); // Debug log
    throw new AppError('Incorrect username or password', 401);
  }
    // Generate token
    const token = this.signToken((user._id as mongoose.Types.ObjectId).toString());
    
    // Create unified user object
    const unifiedUser: UnifiedUser = {
      _id: (user._id as mongoose.Types.ObjectId).toString(),
      role: user.role,
      userType,
      ...(userType === 'admin' ? {
        userName: (user as IAuth).userName
      } : {
        contactNumber: (user as IStaff).contactNumber,
        staffName: (user as IStaff).staffName,
        branch: (user as IStaff).branch
      })
    };

    return { user: unifiedUser, token };
  }

  async getAllUsers(): Promise<IAuth[]> {
    return await Auth.find().select('-password');
  }

  async getUserById(id: string): Promise<IAuth | null> {
    return await Auth.findById(id).select('-password');
  }

  // Get user by ID from both collections (for JWT verification)
  async getUnifiedUserById(id: string): Promise<UnifiedUser | null> {
    // Try Admin first
    const adminUser = await Auth.findById(id).select('-password');
    if (adminUser) {
      return {
        _id: (adminUser._id as mongoose.Types.ObjectId).toString(),
        userName: adminUser.userName,
        role: adminUser.role,
        userType: 'admin'
      };
    }

    // Try Staff
    const staffUser = await Staff.findById(id).select('-password').populate('branch', 'branchName location');
    if (staffUser) {
      return {
        _id: (staffUser._id as mongoose.Types.ObjectId).toString(),
        contactNumber: staffUser.contactNumber,
        staffName: staffUser.staffName,
        role: staffUser.role,
        userType: 'staff',
        branch: staffUser.branch
      };
    }

    return null;
  }

  async updateUser(id: string, updateData: any, updatedBy: string): Promise<IAuth | null> {
    updateData.updatedBy = updatedBy;
    return await Auth.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  async deleteUser(id: string): Promise<void> {
    const user = await Auth.findByIdAndDelete(id);
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }
  }
}