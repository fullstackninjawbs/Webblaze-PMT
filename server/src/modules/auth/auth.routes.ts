import { Router } from 'express';
import { login, register, refresh, logout, me, changePassword, acceptInvite, forgotPassword, resetPassword } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.validation';
import { loginLimiter, forgotPasswordLimiter, tokenLimiter } from '../../middlewares/rateLimit.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';

const router = Router();

// Public routes
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/accept-invite', tokenLimiter, acceptInvite);
router.post('/forgot-password', ...forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', tokenLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, tokenLimiter, validate(changePasswordSchema), changePassword);

// Admin only registration
router.post(
  '/register',
  authMiddleware,
  rbacMiddleware(PERMISSIONS['users:manage']),
  validate(registerSchema),
  register
);

export default router;
