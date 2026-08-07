import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';

const router = Router();

router.use(authMiddleware);

// Any authenticated user can view users or a specific user profile
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Only admins/PMs can manage/modify users
router.use(rbacMiddleware(PERMISSIONS['users:manage']));

router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
