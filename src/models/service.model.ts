import mongoose, { Schema, Document } from 'mongoose';

interface IProductDetails {
  productName: string;
  serialNumber: string;
  brand: string;
  type: string;
  productIssue: string;
}

export interface IService extends Document {
  serviceId: string;
  customerName: string;
  customerContactNumber: string;
  technician?: mongoose.Types.ObjectId;
  action: 'Received' | 'Assigned to Technician' | 'Under Inspection' | 'Waiting for Customer Approval' | 'Approved' | 'In Service' | 'Finished' | 'Delivered' | 'Completed' | 'Cancelled';
  address: string;
  location: string;
  serviceCost?: number;
  receivedDate: Date;
  deliveredDate?: Date;
  productDetails: IProductDetails[];
  branchId: mongoose.Types.ObjectId; // CRITICAL: Make this required
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const productDetailsSchema = new Schema<IProductDetails>({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    trim: true
  },
  productIssue: {
    type: String,
    required: [true, 'Product issue is required'],
    trim: true
  }
});

const serviceSchema = new Schema<IService>({
  serviceId: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerContactNumber: {
    type: String,
    required: [true, 'Customer contact number is required'],
    trim: true
  },
  technician: {
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  },
  action: {
    type: String,
    enum: [
      'Received',
      'Assigned to Technician',
      'Under Inspection',
      'Waiting for Customer Approval',
      'Approved',
      'In Service',
      'Finished',
      'Delivered',
      'Completed',
      'Cancelled'
    ],
    default: 'Received'
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  serviceCost: {
    type: Number,
    min: 0
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  deliveredDate: {
    type: Date
  },
  productDetails: {
    type: [productDetailsSchema],
    required: [true, 'Product details are required'],
    validate: {
      validator: function(v: IProductDetails[]) {
        return v && v.length > 0;
      },
      message: 'At least one product is required'
    }
  },
  // CRITICAL: Ensure branchId is properly defined
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
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
  timestamps: true,
  // IMPORTANT: These options ensure all fields are included in JSON responses
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure branchId is always included in JSON responses
      if (doc.branchId) {
        ret.branchId = doc.branchId;
      }
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure branchId is always included in object responses
      if (doc.branchId) {
        ret.branchId = doc.branchId;
      }
      return ret;
    }
  }
});

// Generate unique service ID
serviceSchema.pre('save', async function(next) {
  if (!this.serviceId) {
    const count = await mongoose.model('Service').countDocuments();
    this.serviceId = `SRV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Service = mongoose.model<IService>('Service', serviceSchema);