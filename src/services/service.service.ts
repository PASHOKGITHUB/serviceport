import { Service, IService } from '../models/service.model';
import { Customer,ICustomer } from '../models/customer.model';
import { Staff } from '../models/staff.model';
import { Branch } from '../models/branch.model';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class ServiceService {
  private readonly ACTION_HIERARCHY = [
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
  ];

async createService(serviceData: any, createdBy: string): Promise<{ services: IService[]; customer: ICustomer[] }> {
    try {
      console.log('=== SERVICE CREATION DEBUG ===');
      console.log('1. Input serviceData:', JSON.stringify(serviceData, null, 2));

      // Validate that the branch exists
      const branch = await Branch.findById(serviceData.branchId);
      if (!branch) {
        throw new AppError('Branch not found', 404);
      }
      console.log('2. Branch found:', branch.branchName);

      // Create separate service records for each product FIRST
      const services: IService[] = [];
      const customers: ICustomer[] = [];
      
      for (const product of serviceData.productDetails) {
        const servicePayload = {
          customerName: serviceData.customerName,
          customerContactNumber: serviceData.customerContactNumber,
          address: serviceData.address,
          location: serviceData.location,
          productDetails: product, // Single product object
          branchId: serviceData.branchId,
          createdBy: createdBy,
          serviceCost: serviceData.serviceCost
        };

        console.log(`3. Creating service for product: ${product.productName}`);
        const service = await Service.create(servicePayload);
        services.push(service);

        // Create separate customer document for each service with serviceId
        console.log(`4. Creating customer record for serviceId: ${service._id}`);
        
        // Check if customer already exists for this specific service
        let existingCustomer = await Customer.findOne({ 
          phone: serviceData.customerContactNumber,
          serviceId: service._id 
        });

        let customer;
        if (existingCustomer) {
          // Update existing customer record for this service
          existingCustomer.visitCount += 1;
          existingCustomer.lastVisitDate = new Date();
          existingCustomer.updatedBy = typeof createdBy === 'string' ? new (require('mongoose').Types.ObjectId)(createdBy) : createdBy;
          
          // Update customer info if provided data is different
          if (existingCustomer.customerName !== serviceData.customerName) {
            existingCustomer.customerName = serviceData.customerName;
          }
          if (existingCustomer.address !== serviceData.address) {
            existingCustomer.address = serviceData.address;
          }
          if (existingCustomer.location !== serviceData.location) {
            existingCustomer.location = serviceData.location;
          }
          
          customer = await existingCustomer.save();
          console.log(`5. Updated existing customer record for serviceId: ${service._id}`);
        } else {
          // Create new customer record with serviceId
          const customerData = {
            customerName: serviceData.customerName,
            phone: serviceData.customerContactNumber,
            location: serviceData.location,
            address: serviceData.address,
            branchId: serviceData.branchId,
            serviceId: service._id, // Store serviceId for tracking
            visitCount: 1,
            lastVisitDate: new Date(),
            createdBy: createdBy
          };

          customer = await Customer.create(customerData);
          console.log(`5. Created new customer record for serviceId: ${service._id}`);
        }

        customers.push(customer);
      }

      console.log(`6. Created ${services.length} service records and ${customers.length} customer records`);

      // Populate all services
      const populatedServices: IService[] = [];
      for (const service of services) {
        const populatedService = await Service.findById(service._id)
          .populate('technician', 'staffName contactNumber')
          .populate('branchId', 'branchName location address contactNumber')
          .exec();
          
        if (populatedService) {
          populatedServices.push(populatedService);
        }
      }

      console.log('7. All services populated successfully');

      return { 
        services: populatedServices,
        customer: customers // Return array of customer records
      };

    } catch (error) {
      console.error('Service creation error:', error);
      throw error;
    }
  }

  // Get all services for a customer by phone number
  async getServicesByCustomerPhone(phone: string): Promise<{ customer: ICustomer | null; services: IService[] }> {
    try {
      const customer = await Customer.findOne({ phone });
      
      if (!customer) {
        return { customer: null, services: [] };
      }

      const services = await Service.find({ customerContactNumber: phone })
        .populate('technician', 'staffName contactNumber')
        .populate('branchId', 'branchName location address contactNumber')
        .sort({ createdAt: -1 }); // Most recent first

      return { customer, services };
    } catch (error) {
      console.error('Error fetching customer services:', error);
      throw error;
    }
  }

  // Get customer summary with service statistics
  async getCustomerSummary(phone: string): Promise<{
    customer: ICustomer | null;
    totalServices: number;
    activeServices: number;
    completedServices: number;
    recentServices: IService[];
  }> {
    try {
      const { customer, services } = await this.getServicesByCustomerPhone(phone);

      if (!customer) {
        return {
          customer: null,
          totalServices: 0,
          activeServices: 0,
          completedServices: 0,
          recentServices: []
        };
      }

      const activeServices = services.filter(s => 
        !['Completed', 'Cancelled', 'Delivered'].includes(s.action)
      ).length;
      
      const completedServices = services.filter(s => 
        ['Completed', 'Delivered'].includes(s.action)
      ).length;

      const recentServices = services.slice(0, 5); // Last 5 services

      return {
        customer,
        totalServices: services.length,
        activeServices,
        completedServices,
        recentServices
      };
    } catch (error) {
      console.error('Error fetching customer summary:', error);
      throw error;
    }
  }

  async getAllServices(queryString: any): Promise<any[]> {
    // Create base filter object
    const filter: any = {};

    // Handle branchId filter
    if (queryString.branchId) {
      filter.branchId = queryString.branchId;
    }

    // Handle search
    if (queryString.search) {
      const searchRegex = new RegExp(queryString.search, 'i');
      
      // Get all branches that match the search term
      const matchingBranches = await Branch.find({
        $or: [
          { branchName: searchRegex },
          { location: searchRegex }
        ]
      }).select('_id');
      
      const branchIds = matchingBranches.map(branch => branch._id);
      
      filter.$or = [
        { serviceId: searchRegex },
        { customerName: searchRegex },
        { customerContactNumber: searchRegex },
        { location: searchRegex },
        { 'productDetails.productName': searchRegex },
        { 'productDetails.brand': searchRegex },
        { branchId: { $in: branchIds } }
      ];
    }

    // Build query with explicit population
    let query = Service.find(filter)
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');

    // Apply sorting
    if (queryString.sort) {
      const sortBy = queryString.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Apply pagination
    const page = queryString.page * 1 || 1;
    const limit = queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    // Execute query and convert to plain objects to ensure all fields are included
    const services = await query.lean().exec();
    
    // Return services with guaranteed branchId inclusion
    return services.map(service => ({
      ...service,
      branchId: service.branchId // Ensure branchId is explicitly included
    }));
  }

  async getServiceById(id: string): Promise<IService> {
    const service = await Service.findById(id)
      .populate('technician', 'staffName contactNumber role branch')
      .populate('branchId', 'branchName location address contactNumber');
      
    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }
    return service;
  }

async updateService(id: string, updateData: any, updatedBy: string): Promise<IService> {
  // If technician is being assigned, verify they exist and are active
  if (updateData.technician) {
    const technician = await Staff.findById(updateData.technician);
    if (!technician || technician.action !== 'Active') {
      throw new AppError('Technician not found or inactive', 404);
    }
  }

  // If branchId is being updated, verify the branch exists
  if (updateData.branchId) {
    const branch = await Branch.findById(updateData.branchId);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
  }

  updateData.updatedBy = updatedBy;
  const service = await Service.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('technician', 'staffName contactNumber role')
    .populate('branchId', 'branchName location address contactNumber');

  if (!service) {
    throw new AppError('No service found with that ID', 404);
  }

  // Prepare customer update data
  const customerUpdateData: any = { 
    serviceStatus: service.action, 
    updatedBy: updatedBy 
  };
  
  // Add customer-related fields if they are being updated
  if (updateData.customerName) {
    customerUpdateData.customerName = updateData.customerName;
  }
  
  if (updateData.customerContactNumber) {
    customerUpdateData.phone = updateData.customerContactNumber;
  }
  
  if (updateData.address) {
    customerUpdateData.address = updateData.address;
  }
  
  if (updateData.location) {
    customerUpdateData.location = updateData.location;
  }
  
  if (updateData.branchId) {
    customerUpdateData.branchId = updateData.branchId;
  }

  // Update customer record
  await Customer.findOneAndUpdate(
    { serviceId: id },
    customerUpdateData,
    { new: true, runValidators: true }
  );

  return service;
}

async updateServiceAction(id: string, newAction: string, updatedBy: string, cancellationReason?: string): Promise<IService> {
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('No service found with that ID', 404);
  }

  // Existing cancellation validation...
  if (newAction === 'Cancelled') {
    if (!cancellationReason || cancellationReason.trim().length === 0) {
      throw new AppError('Cancellation reason is required when setting action to Cancelled', 400);
    }
  }

  // NEW VALIDATION: Check service cost before marking as completed
  if (newAction === 'Completed') {
    if (!service.serviceCost || service.serviceCost <= 0) {
      throw new AppError('Service cost must be set and greater than 0 before marking service as completed', 400);
    }
  }

  const updateData: any = { 
    action: newAction, 
    updatedBy: updatedBy 
  };
  
  // Rest of your existing code remains the same...
  if (newAction === 'Delivered' && !service.deliveredDate) {
    updateData.deliveredDate = new Date();
  }

  if (newAction === 'Cancelled' && cancellationReason) {
    updateData.cancellationReason = cancellationReason.trim();
  }

  if (service.action === 'Completed' && newAction !== 'Completed') {
    updateData.serviceCost = 0;
  }

  const updatedService = await Service.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('technician', 'staffName contactNumber role')
    .populate('branchId', 'branchName location address contactNumber');

  if (!updatedService) {
    throw new AppError('Service update failed', 500);
  }

  await Customer.findOneAndUpdate(
    { serviceId: id },
    { serviceStatus: newAction, updatedBy: updatedBy }
  );

  return updatedService;
}

  async assignTechnician(serviceId: string, technicianId: string, updatedBy: string): Promise<IService> {
    // Verify technician exists and is active
    const technician = await Staff.findById(technicianId);
    if (!technician || technician.action !== 'Active' || technician.role !== 'Technician') {
      throw new AppError('Technician not found, inactive, or not a technician', 404);
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      { 
        technician: technicianId,
        action: 'Assigned to Technician',
        updatedBy: updatedBy 
      },
      { new: true, runValidators: true }
    )
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');

    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }

    // Update customer service status
    await Customer.findOneAndUpdate(
      { serviceId: serviceId },
      { serviceStatus: 'Assigned to Technician', updatedBy: updatedBy }
    );

    return service;
  }

  async deleteService(id: string): Promise<void> {
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }

    // Delete associated customer record
    await Customer.findOneAndDelete({ serviceId: id });
  }

  async getServicesByStatus(status: string): Promise<IService[]> {
    return await Service.find({ action: status })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }

  async getServicesByTechnician(technicianId: string): Promise<IService[]> {
    return await Service.find({ technician: technicianId })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }

  async getServicesByBranch(branchId: string): Promise<IService[]> {
    return await Service.find({ branchId })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }

  async getServiceStats(): Promise<any> {
    const stats = await Service.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalServices = await Service.countDocuments();
    
    // Get stats by branch
    const branchStats = await Service.aggregate([
      {
        $group: {
          _id: '$branchId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      {
        $unwind: '$branch'
      },
      {
        $project: {
          branchName: '$branch.branchName',
          count: 1
        }
      }
    ]);
    
    return {
      totalServices,
      statusBreakdown: stats,
      branchStats
    };
  }

  async getServicesReport(queryString: any): Promise<any> {
    const { startDate, endDate, branchId, status } = queryString;
    
    let matchConditions: any = {};
    
    if (startDate && endDate) {
      matchConditions.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (branchId) {
      matchConditions.branchId = branchId;
    }
    
    if (status) {
      matchConditions.action = status;
    }

    const report = await Service.aggregate([
      { $match: matchConditions },
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
          _id: {
            status: '$action',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            branchId: '$branchId',
            branchName: '$branch.branchName'
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$serviceCost' },
          avgCost: { $avg: '$serviceCost' }
        }
      },
      {
        $group: {
          _id: { 
            month: '$_id.month', 
            year: '$_id.year',
            branchId: '$_id.branchId',
            branchName: '$_id.branchName'
          },
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalCost: '$totalCost',
              avgCost: '$avgCost'
            }
          },
          totalServices: { $sum: '$count' },
          totalRevenue: { $sum: '$totalCost' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return report;
  }

  async updateServiceCost(id: string, serviceCost: number, updatedBy: string): Promise<IService> {
    const service = await Service.findByIdAndUpdate(
      id,
      { serviceCost, updatedBy },
      { new: true, runValidators: true }
    )
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');

    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }

    return service;
  }

  async bulkUpdateServices(serviceIds: string[], updateData: any, updatedBy: string): Promise<IService[]> {
    updateData.updatedBy = updatedBy;
    
    await Service.updateMany(
      { _id: { $in: serviceIds } },
      updateData
    );

    return await Service.find({ _id: { $in: serviceIds } })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }

  async getOverdueServices(): Promise<IService[]> {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 7);

    return await Service.find({
      action: { $nin: ['Completed', 'Cancelled', 'Delivered'] },
      createdAt: { $lt: overdueDate }
    })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }

  async getServicesByDateRange(startDate: Date, endDate: Date): Promise<IService[]> {
    return await Service.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('technician', 'staffName contactNumber role')
      .populate('branchId', 'branchName location address contactNumber');
  }
}