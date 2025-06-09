// src/services/staff.service.ts

import { Staff, IStaff } from '../models/staff.model';
import { Branch } from '../models/branch.model';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class StaffService {
  async createStaff(staffData: any, createdBy: string): Promise<IStaff> {
    // Verify branch exists
    const branch = await Branch.findById(staffData.branch);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    // Check if contact number is already used
    const existingStaff = await Staff.findOne({ contactNumber: staffData.contactNumber });
    if (existingStaff) {
      throw new AppError('Contact number already exists', 400);
    }

    // Ensure password is provided
    if (!staffData.password) {
      throw new AppError('Password is required for staff', 400);
    }

    staffData.createdBy = new (require('mongoose').Types.ObjectId)(createdBy);
    const staff = await Staff.create(staffData);
    
    // Add staff to branch
    await Branch.findByIdAndUpdate(
      staffData.branch,
      { $addToSet: { staffName: staff._id } }
    );

    const populatedStaff = await Staff.findById(staff._id)
      .populate('branch', 'branchName location')
      .select('-password'); // Don't return password
    
    if (!populatedStaff) {
      throw new AppError('Staff creation failed', 500);
    }

    return populatedStaff;
  }

  async getAllStaff(queryString: any): Promise<IStaff[]> {
    const features = new APIFeatures(
      Staff.find().populate('branch', 'branchName location').select('-password'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.query;
  }

  async getStaffById(id: string): Promise<IStaff> {
    const staff = await Staff.findById(id)
      .populate('branch', 'branchName location address')
      .select('-password');
    
    if (!staff) {
      throw new AppError('No staff found with that ID', 404);
    }
    return staff;
  }

  async updateStaff(id: string, updateData: any, updatedBy: string): Promise<IStaff> {
    // If contact number is being updated, check uniqueness
    if (updateData.contactNumber) {
      const existingStaff = await Staff.findOne({ 
        contactNumber: updateData.contactNumber,
        _id: { $ne: id } // Exclude current staff
      });
      if (existingStaff) {
        throw new AppError('Contact number already exists', 400);
      }
    }

    // If branch is being updated, verify it exists
    if (updateData.branch) {
      const branch = await Branch.findById(updateData.branch);
      if (!branch) {
        throw new AppError('Branch not found', 404);
      }

      // Remove staff from old branch and add to new branch
      const oldStaff = await Staff.findById(id);
      if (oldStaff && oldStaff.branch.toString() !== updateData.branch) {
        await Branch.findByIdAndUpdate(
          oldStaff.branch,
          { $pull: { staffName: id } }
        );
        await Branch.findByIdAndUpdate(
          updateData.branch,
          { $addToSet: { staffName: id } }
        );
      }
    }

    updateData.updatedBy = updatedBy;

    const staff = await Staff.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true, // Enable validation for password if updated
    })
      .populate('branch', 'branchName location')
      .select('-password');

    if (!staff) {
      throw new AppError('No staff found with that ID', 404);
    }
    return staff;
  }

  async deleteStaff(id: string): Promise<void> {
    const staff = await Staff.findById(id);
    if (!staff) {
      throw new AppError('No staff found with that ID', 404);
    }

    // Remove staff from branch
    await Branch.findByIdAndUpdate(
      staff.branch,
      { $pull: { staffName: id } }
    );

    await Staff.findByIdAndDelete(id);
  }

  async getStaffByBranch(branchId: string): Promise<IStaff[]> {
    return await Staff.find({ branch: branchId, action: 'Active' })
      .populate('branch', 'branchName location')
      .select('-password');
  }

  async getTechnicians(): Promise<IStaff[]> {
    return await Staff.find({ role: 'Technician', action: 'Active' })
      .populate('branch', 'branchName location')
      .select('-password');
  }
}