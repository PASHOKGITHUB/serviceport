import { Router } from 'express';
import {
  createBranch,
  getAllBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  addStaffToBranch,
  removeStaffFromBranch,
  updateBranchStatus
} from '../controllers/branch.controller';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import { createBranchSchema, updateBranchSchema,updateBranchStatusSchema  } from '../validators/branch.schema';

const router = Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getAllBranches)
  .post(restrictTo('admin', 'manager'), validate(createBranchSchema), createBranch);

router
  .route('/:id')
  .get(getBranch)
  .patch(restrictTo('admin', 'manager'), validate(updateBranchSchema), updateBranch)
  .delete(restrictTo('admin'), deleteBranch);


router.patch('/:id/status', 
  restrictTo('admin', 'manager'), 
  validate(updateBranchStatusSchema), 
  updateBranchStatus
);


// Staff management for branches
router.patch('/:branchId/staff/:staffId/add', restrictTo('admin', 'manager'), addStaffToBranch);
router.patch('/:branchId/staff/:staffId/remove', restrictTo('admin', 'manager'), removeStaffFromBranch);

export default router;