import { Router } from 'express';
import {
  getAllCustomers,
  getCustomer,
  getCustomerByService,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomersByBranch,
  getCustomerHistory,
  getCustomerStats,
  createCustomer
} from '../controllers/customer.controller';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import { updateCustomerSchema, createCustomerSchema } from '../validators/customer.schema';

const router = Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getAllCustomers)
  .post(validate(createCustomerSchema), createCustomer);

// Static routes FIRST
router.get('/search', searchCustomers);
router.get('/stats', restrictTo('admin', 'manager'), getCustomerStats);

// Parameterized routes
router.get('/branch/:branchId', getCustomersByBranch);
router.get('/service/:serviceId', getCustomerByService);

// Dynamic ID routes LAST
router
  .route('/:id')
  .get(getCustomer)
  .patch(validate(updateCustomerSchema), updateCustomer)
  .delete(restrictTo('admin', 'manager'), deleteCustomer);

router.get('/:id/history', getCustomerHistory);

export default router;