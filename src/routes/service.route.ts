import { Router } from 'express';
import {
  createService,
  getAllServices,
  getService,
  updateService,
  updateServiceAction,
  assignTechnician,
  deleteService,
  getServicesByStatus,
  getServicesByTechnician,
  getServiceStats,
  getServicesReport,
  updateServiceCost,
  bulkUpdateServices
} from '../controllers/service.controller';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import { 
  createServiceSchema, 
  updateServiceSchema, 
  updateServiceActionSchema,
  updateServiceCostSchema,
  bulkUpdateServicesSchema,
  assignTechnicianSchema
} from '../validators/service.schema';

const router = Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getAllServices)
  .post(validate(createServiceSchema), createService);

// IMPORTANT: Static routes MUST come BEFORE parameterized routes
router.get('/stats', restrictTo('admin', 'manager'), getServiceStats);
router.get('/report', restrictTo('admin', 'manager'), getServicesReport);
router.patch('/bulk-update', restrictTo('admin', 'manager'), validate(bulkUpdateServicesSchema), bulkUpdateServices);

// Routes with parameters
router.get('/status/:status', getServicesByStatus);
router.get('/technician/:technicianId', getServicesByTechnician);

// Dynamic ID routes come last
router
  .route('/:id')
  .get(getService)
  .patch(validate(updateServiceSchema), updateService)
  .delete(restrictTo('admin', 'manager'), deleteService);

router.patch('/:id/action', validate(updateServiceActionSchema), updateServiceAction);
router.patch('/:id/assign-technician', restrictTo('admin', 'manager'), validate(assignTechnicianSchema), assignTechnician);
router.patch('/:id/cost', restrictTo('admin', 'manager'), validate(updateServiceCostSchema), updateServiceCost);

export default router;