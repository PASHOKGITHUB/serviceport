import { Branch, IBranch } from '../models/branch.model';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class BranchService {
  async createBranch(branchData: any, createdBy: string): Promise<IBranch> {
    branchData.createdBy = createdBy;
    return await Branch.create(branchData);
  }

  async getAllBranches(queryString: any): Promise<IBranch[]> {
    const features = new APIFeatures(Branch.find().populate('staffName', 'staffName role'), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    return await features.query;
  }

  async getBranchById(id: string): Promise<IBranch | null> {
    const branch = await Branch.findById(id).populate('staffName', 'staffName role contactNumber');
    if (!branch) {
      throw new AppError('No branch found with that ID', 404);
    }
    return branch;
  }

  async updateBranch(id: string, updateData: any, updatedBy: string): Promise<IBranch | null> {
    updateData.updatedBy = updatedBy;
    const branch = await Branch.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('staffName', 'staffName role');

    if (!branch) {
      throw new AppError('No branch found with that ID', 404);
    }
    return branch;
  }

  async deleteBranch(id: string): Promise<void> {
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      throw new AppError('No branch found with that ID', 404);
    }
  }

  async addStaffToBranch(branchId: string, staffId: string, updatedBy: string): Promise<IBranch | null> {
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { 
        $addToSet: { staffName: staffId },
        updatedBy: updatedBy 
      },
      { new: true, runValidators: true }
    ).populate('staffName', 'staffName role');

    if (!branch) {
      throw new AppError('No branch found with that ID', 404);
    }
    return branch;
  }

  async removeStaffFromBranch(branchId: string, staffId: string, updatedBy: string): Promise<IBranch | null> {
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { 
        $pull: { staffName: staffId },
        updatedBy: updatedBy 
      },
      { new: true, runValidators: true }
    ).populate('staffName', 'staffName role');

    if (!branch) {
      throw new AppError('No branch found with that ID', 404);
    }
    return branch;
  }
}