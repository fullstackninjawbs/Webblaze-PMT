import { Router } from 'express';
import { login, register, refresh, logout, me, changePassword, acceptInvite, forgotPassword, resetPassword } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);
router.post('/accept-invite', acceptInvite);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);

// Admin only registration
router.post(
  '/register',
  authMiddleware,
  rbacMiddleware(PERMISSIONS['users:manage']),
  validate(registerSchema),
  register
);

export default router;
