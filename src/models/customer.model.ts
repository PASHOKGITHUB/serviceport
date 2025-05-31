import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  customerName: string;
  phone: string;
  location: string;
  serviceId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  address: string;
  serviceStatus: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const customerSchema = new Schema<ICustomer>({
  customerId: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  serviceStatus: {
    type: String,
    default: 'Received'
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

// Generate unique customer ID
customerSchema.pre('save', async function(next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUST${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);