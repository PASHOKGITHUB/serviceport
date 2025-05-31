import { Service, IService } from '../models/service.model';
import { Customer } from '../models/customer.model';
import { Staff } from '../models/staff.model';
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

  async createService(serviceData: any, createdBy: string): Promise<{ service: IService; customer: any }> {
    serviceData.createdBy = createdBy;
    const service = await Service.create(serviceData);

    // Create customer record
    const customerData = {
      customerName: serviceData.customerName,
      phone: serviceData.customerContactNumber,
      location: serviceData.location,
      address: serviceData.address,
      serviceId: service._id,
      branchId: serviceData.branchId,
      serviceStatus: service.action,
      createdBy: createdBy
    };

    const customer = await Customer.create(customerData);

    const populatedService = await Service.findById(service._id).populate('technician', 'staffName contactNumber');
    if (!populatedService) {
      throw new AppError('Service creation failed', 500);
    }

    return { 
      service: populatedService,
      customer 
    };
  }

  async getAllServices(queryString: any): Promise<IService[]> {
    const features = new APIFeatures(
      Service.find().populate('technician', 'staffName contactNumber role'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.query;
  }

  async getServiceById(id: string): Promise<IService> {
    const service = await Service.findById(id).populate('technician', 'staffName contactNumber role branch');
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

    updateData.updatedBy = updatedBy;
    const service = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('technician', 'staffName contactNumber role');

    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }

    // Update customer service status
    await Customer.findOneAndUpdate(
      { serviceId: id },
      { serviceStatus: service.action, updatedBy: updatedBy }
    );

    return service;
  }

  async updateServiceAction(id: string, newAction: string, updatedBy: string): Promise<IService> {
    const service = await Service.findById(id);
    if (!service) {
      throw new AppError('No service found with that ID', 404);
    }

    const currentIndex = this.ACTION_HIERARCHY.indexOf(service.action);
    const newIndex = this.ACTION_HIERARCHY.indexOf(newAction);

    // Check if action transition is valid (can only move forward or to cancelled)
    if (newAction !== 'Cancelled' && newIndex <= currentIndex) {
      throw new AppError(`Cannot move from ${service.action} to ${newAction}. Invalid action hierarchy.`, 400);
    }

    // If moving to delivered, set delivered date
    const updateData: any = { 
      action: newAction, 
      updatedBy: updatedBy 
    };
    
    if (newAction === 'Delivered' && !service.deliveredDate) {
      updateData.deliveredDate = new Date();
    }

    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('technician', 'staffName contactNumber role');

    if (!updatedService) {
      throw new AppError('Service update failed', 500);
    }

    // Update customer service status
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
    ).populate('technician', 'staffName contactNumber role');

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
    return await Service.find({ action: status }).populate('technician', 'staffName contactNumber role');
  }

  async getServicesByTechnician(technicianId: string): Promise<IService[]> {
    return await Service.find({ technician: technicianId }).populate('technician', 'staffName contactNumber role');
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
    
    return {
      totalServices,
      statusBreakdown: stats
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
      // You would need to add branchId field to Service model or join with Customer
      matchConditions.branchId = branchId;
    }
    
    if (status) {
      matchConditions.action = status;
    }

    const report = await Service.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            status: '$action',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$serviceCost' },
          avgCost: { $avg: '$serviceCost' }
        }
      },
      {
        $group: {
          _id: { month: '$_id.month', year: '$_id.year' },
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
    ).populate('technician', 'staffName contactNumber role');

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
      .populate('technician', 'staffName contactNumber role');
  }

  async getOverdueServices(): Promise<IService[]> {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 7); // 7 days overdue

    return await Service.find({
      action: { $nin: ['Completed', 'Cancelled', 'Delivered'] },
      createdAt: { $lt: overdueDate }
    }).populate('technician', 'staffName contactNumber role');
  }

  async getServicesByDateRange(startDate: Date, endDate: Date): Promise<IService[]> {
    return await Service.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('technician', 'staffName contactNumber role');
  }
}