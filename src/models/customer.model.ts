import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  customerName: string;
  phone: string;
  location: string;
  branchId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId; // New field to track service association
  address: string;
  visitCount: number; // Track visit count per service
  lastVisitDate: Date; // Track last visit per service
  serviceStatus: string; // Track service status
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
    trim: true,
    index: true // Add index for faster queries
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'] // Required for service-specific tracking
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  visitCount: {
    type: Number,
    default: 1, // Start with 1 for new customers
    min: 1
  },
  lastVisitDate: {
    type: Date,
    default: Date.now
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

// Create compound index for phone and serviceId combination for efficient queries
customerSchema.index({ phone: 1, serviceId: 1 });

// Create compound unique index to ensure one customer record per service
customerSchema.index({ phone: 1, serviceId: 1 }, { unique: true });

// Generate unique customer ID
customerSchema.pre('save', async function(next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUST${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);