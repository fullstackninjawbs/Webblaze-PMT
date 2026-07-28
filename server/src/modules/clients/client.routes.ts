import { Router } from 'express';
import * as clientController from './client.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createClientSchema, updateClientSchema } from './client.validation';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

// Only ADMIN and PM can manage clients
router.use(rbacMiddleware([Role.ADMIN, Role.PM]));

router.post('/', validate(createClientSchema), clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.patch('/:id', validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
