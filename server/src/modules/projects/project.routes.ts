import { Router } from 'express';
import * as projectController from './project.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from './project.validation';
import { Role } from '../../types';

import { PERMISSIONS } from '../../config/permissions';

const router = Router();

router.use(authMiddleware);

// All roles can GET projects (Service filters based on role)
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

// Admin and PM can create and update projects
router.post('/', rbacMiddleware(PERMISSIONS['projects:manage']), validate(createProjectSchema), projectController.createProject);
router.patch('/:id', rbacMiddleware(PERMISSIONS['projects:manage']), validate(updateProjectSchema), projectController.updateProject);

// Admin and PM can delete projects
router.delete('/:id', rbacMiddleware(PERMISSIONS['projects:manage']), projectController.deleteProject);

export default router;
