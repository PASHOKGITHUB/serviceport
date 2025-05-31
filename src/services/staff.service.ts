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

    staffData.createdBy = createdBy;
    const staff = await Staff.create(staffData);
    
    // Add staff to branch
    await Branch.findByIdAndUpdate(
      staffData.branch,
      { $addToSet: { staffName: staff._id } }
    );

    const populatedStaff = await Staff.findById(staff._id).populate('branch', 'branchName location');
    if (!populatedStaff) {
      throw new AppError('Staff creation failed', 500);
    }

    return populatedStaff;
  }

  async getAllStaff(queryString: any): Promise<IStaff[]> {
    const features = new APIFeatures(Staff.find().populate('branch', 'branchName location'), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.query;
  }

  async getStaffById(id: string): Promise<IStaff> {
    const staff = await Staff.findById(id).populate('branch', 'branchName location address');
    if (!staff) {
      throw new AppError('No staff found with that ID', 404);
    }
    return staff;
  }

  async updateStaff(id: string, updateData: any, updatedBy: string): Promise<IStaff> {
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
      runValidators: true,
    }).populate('branch', 'branchName location');

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
    return await Staff.find({ branch: branchId, action: 'Active' }).populate('branch', 'branchName location');
  }

  async getTechnicians(): Promise<IStaff[]> {
    return await Staff.find({ role: 'Technician', action: 'Active' }).populate('branch', 'branchName location');
  }
}