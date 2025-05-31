import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  staffName: string;
  contactNumber: string;
  role: 'Technician' | 'Staff' | 'Manager';
  branch: mongoose.Types.ObjectId;
  action: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
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
    trim: true
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

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);