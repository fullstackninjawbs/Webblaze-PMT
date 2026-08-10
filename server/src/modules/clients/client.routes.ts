import { Router } from 'express';
import * as clientController from './client.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createClientSchema, updateClientSchema } from './client.validation';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

// All authenticated users can view clients
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);

// Only ADMIN and PM can manage (create, update, delete) clients
router.use(rbacMiddleware([Role.ADMIN, Role.PM]));

router.post('/', validate(createClientSchema), clientController.createClient);
router.patch('/:id', validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
