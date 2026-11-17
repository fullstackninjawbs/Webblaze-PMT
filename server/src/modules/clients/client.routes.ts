import { Router } from 'express';
import * as clientController from './client.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';
import { validate } from '../../middlewares/validate.middleware';
import { createClientSchema, updateClientSchema } from './client.validation';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

// All authenticated users can view clients
// Client contact details are for Admin / PM only
router.get('/', rbacMiddleware(PERMISSIONS['clients:view']), clientController.getClients);
router.get('/:id', rbacMiddleware(PERMISSIONS['clients:view']), clientController.getClientById);

router.post('/', rbacMiddleware([Role.ADMIN, Role.PM]), validate(createClientSchema), clientController.createClient);
router.patch('/:id', rbacMiddleware([Role.ADMIN, Role.PM]), validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', rbacMiddleware([Role.ADMIN]), clientController.deleteClient);

export default router;
