import { Branch, IBranch } from '../models/branch.model';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class BranchService {
  async createBranch(branchData: any, createdBy: string): Promise<IBranch> {
    // Check for duplicate branch name
    const existingBranch = await Branch.findOne({ 
      branchName: { $regex: new RegExp(`^${branchData.branchName}$`, 'i') }
    });
    
    if (existingBranch) {
      throw new AppError('Branch with this name already exists', 400);
    }

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
    // Check for duplicate branch name if branchName is being updated
    if (updateData.branchName) {
      const existingBranch = await Branch.findOne({ 
        branchName: { $regex: new RegExp(`^${updateData.branchName}$`, 'i') },
        _id: { $ne: id } // Exclude current branch from duplicate check
      });
      
      if (existingBranch) {
        throw new AppError('Branch with this name already exists', 400);
      }
    }

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

  async updateBranchStatus(id: string, status: 'Active' | 'Inactive', updatedBy: string): Promise<IBranch | null> {
    const branch = await Branch.findByIdAndUpdate(
      id, 
      { 
        status,
        updatedBy 
      }, 
      {
        new: true,
        runValidators: true,
      }
    ).populate('staffName', 'staffName role');

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