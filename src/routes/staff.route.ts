import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  getStaffByBranch,
  getTechnicians
} from '../controllers/staff.controller';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import { createStaffSchema, updateStaffSchema } from '../validators/staff.schema';

const router = Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getAllStaff)
  .post(restrictTo('admin', 'manager'), validate(createStaffSchema), createStaff);

router.get('/technicians', getTechnicians);
router.get('/branch/:branchId', getStaffByBranch);

router
  .route('/:id')
  .get(getStaff)
  .patch(restrictTo('admin', 'manager'), validate(updateStaffSchema), updateStaff)
  .delete(restrictTo('admin'), deleteStaff);

export default router;