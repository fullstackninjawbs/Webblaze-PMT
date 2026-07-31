import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';

const router = Router();

router.use(authMiddleware);

// Any authenticated user can view a profile
router.get('/:id', userController.getUserById);

// Only admins/PMs can manage users
router.use(rbacMiddleware(PERMISSIONS['users:manage']));

router.get('/', userController.getUsers);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
