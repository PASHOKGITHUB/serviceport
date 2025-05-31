import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  branchName: string;
  phoneNumber: string;
  location: string;
  staffName: mongoose.Types.ObjectId[];
  status: 'Active' | 'Inactive';
  address: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const branchSchema = new Schema<IBranch>({
  branchName: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  staffName: [{
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
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

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);