import { Customer, ICustomer } from '../models/customer.model';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class CustomerService {
  async getAllCustomers(queryString: any): Promise<ICustomer[]> {
    const features = new APIFeatures(
      Customer.find()
        .populate('serviceId', 'serviceId action productDetails')
        .populate('branchId', 'branchName location'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.query;
  }

  async getCustomerById(id: string): Promise<ICustomer | null> {
    const customer = await Customer.findById(id)
      .populate('serviceId', 'serviceId action productDetails serviceCost receivedDate deliveredDate')
      .populate('branchId', 'branchName location address phoneNumber');
    
    if (!customer) {
      throw new AppError('No customer found with that ID', 404);
    }
    return customer;
  }

  async getCustomerByServiceId(serviceId: string): Promise<ICustomer | null> {
    return await Customer.findOne({ serviceId })
      .populate('serviceId', 'serviceId action productDetails serviceCost')
      .populate('branchId', 'branchName location');
  }

  async updateCustomer(id: string, updateData: any, updatedBy: string): Promise<ICustomer | null> {
    updateData.updatedBy = updatedBy;
    const customer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('serviceId', 'serviceId action').populate('branchId', 'branchName location');

    if (!customer) {
      throw new AppError('No customer found with that ID', 404);
    }
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      throw new AppError('No customer found with that ID', 404);
    }
  }

  async searchCustomers(searchTerm: string): Promise<ICustomer[]> {
    return await Customer.find({
      $or: [
        { customerName: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { customerId: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .populate('serviceId', 'serviceId action')
    .populate('branchId', 'branchName location');
  }

  async getCustomersByBranch(branchId: string): Promise<ICustomer[]> {
    return await Customer.find({ branchId })
      .populate('serviceId', 'serviceId action productDetails')
      .populate('branchId', 'branchName location');
  }

  // Add these methods to the existing CustomerService class

async createCustomer(customerData: any, createdBy: string): Promise<ICustomer> {
  customerData.createdBy = createdBy;
  return await Customer.create(customerData);
}

async getCustomerHistory(customerId: string): Promise<any> {
  const customer = await Customer.findById(customerId)
    .populate({
      path: 'serviceId',
      select: 'serviceId action productDetails serviceCost receivedDate deliveredDate'
    });

  if (!customer) {
    throw new AppError('No customer found with that ID', 404);
  }

  // Get all services for this customer (by phone number)
  const allServices = await Customer.find({ phone: customer.phone })
    .populate({
      path: 'serviceId',
      select: 'serviceId action productDetails serviceCost receivedDate deliveredDate createdAt'
    })
    .populate('branchId', 'branchName location')
    .sort({ createdAt: -1 });

  return {
    customer,
    serviceHistory: allServices
  };
}

async getCustomerStats(): Promise<any> {
  const totalCustomers = await Customer.countDocuments();
  
  const statusStats = await Customer.aggregate([
    {
      $group: {
        _id: '$serviceStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const branchStats = await Customer.aggregate([
    {
      $lookup: {
        from: 'branches',
        localField: 'branchId',
        foreignField: '_id',
        as: 'branch'
      }
    },
    {
      $unwind: '$branch'
    },
    {
      $group: {
        _id: '$branch.branchName',
        count: { $sum: 1 }
      }
    }
  ]);

  const monthlyStats = await Customer.aggregate([
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);

  return {
    totalCustomers,
    statusBreakdown: statusStats,
    branchBreakdown: branchStats,
    monthlyBreakdown: monthlyStats
  };
}

async getRepeatCustomers(): Promise<ICustomer[]> {
  const repeatCustomers = await Customer.aggregate([
    {
      $group: {
        _id: '$phone',
        count: { $sum: 1 },
        customers: { $push: '$$ROOT' }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    },
    {
      $unwind: '$customers'
    },
    {
      $replaceRoot: { newRoot: '$customers' }
    }
  ]);

  return await Customer.populate(repeatCustomers, [
    { path: 'serviceId', select: 'serviceId action productDetails' },
    { path: 'branchId', select: 'branchName location' }
  ]);
}

}