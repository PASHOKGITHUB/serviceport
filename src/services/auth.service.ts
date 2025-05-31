import jwt from 'jsonwebtoken';
import { Auth, IAuth } from '../models/auth.model';
import { AppError } from '../middlewares/error';
import mongoose from 'mongoose';

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
    
    // Use string assertion for the secret and options
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

  async login(userName: string, password: string): Promise<{ user: Partial<IAuth>; token: string }> {
    // Check if user exists && password is correct
    const user = await Auth.findOne({ userName }).select('+password');

    if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect username or password', 401);
    }

    // Generate token
    const token = this.signToken((user._id as mongoose.Types.ObjectId).toString());
    
    // Remove password from output
    const userObj = user.toObject();
    const { password: pwd, ...userWithoutPassword } = userObj;

    return { user: userWithoutPassword, token };
  }

  async getAllUsers(): Promise<IAuth[]> {
    return await Auth.find().select('-password');
  }

  async getUserById(id: string): Promise<IAuth | null> {
    return await Auth.findById(id).select('-password');
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