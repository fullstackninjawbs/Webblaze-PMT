import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(PERMISSIONS['users:manage'])); // Only admins/PMs as defined

router.get('/', userController.getUsers);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
