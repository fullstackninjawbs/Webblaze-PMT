import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { PERMISSIONS } from '../../config/permissions';
import { adminUpdateUserSchema, updateMyProfileSchema } from './user.validation';

const router = Router();

router.use(authMiddleware);

// Any user can edit their own name and email. Declared before /:id so "me" is not an id.
router.patch('/me', validate(updateMyProfileSchema), userController.updateMyProfile);

// Any authenticated user can view users or a specific user profile
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Only admins manage other users
router.use(rbacMiddleware(PERMISSIONS['users:manage']));

router.patch('/:id', validate(adminUpdateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
