import { Router } from 'express';
import {
  register,
  login,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import { createAuthSchema, loginSchema } from '../validators/auth.schema';

const router = Router();

// Public routes
router.post('/register', validate(createAuthSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/:id', restrictTo('admin', 'manager'), getUser);
router.patch('/:id', restrictTo('admin'), updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

export default router;