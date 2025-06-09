// src/models/staff.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IStaff extends Document {
  staffName: string;
  contactNumber: string;
  password?: string; // Make password optional in interface for security
  role: 'Technician' | 'Staff' | 'Manager';
  branch: mongoose.Types.ObjectId;
  address: string;
  action: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
}

const staffSchema = new Schema<IStaff>({
  staffName: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    unique: true, // Make this unique to use as username
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['Technician', 'Staff', 'Manager'],
    required: [true, 'Role is required']
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  action: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Auth',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Auth'
  }
}, {
  timestamps: true
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password!, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

// Method to check password
staffSchema.methods.correctPassword = async function(candidatePassword: string, userPassword: string) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);