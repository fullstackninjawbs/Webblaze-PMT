import { Router } from 'express';
import * as projectController from './project.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from './project.validation';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

// All roles can GET projects (Service filters based on role)
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

// Only ADMIN and PM can create/update/delete projects
router.post('/', rbacMiddleware([Role.ADMIN, Role.PM]), validate(createProjectSchema), projectController.createProject);
router.patch('/:id', rbacMiddleware([Role.ADMIN, Role.PM]), validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', rbacMiddleware([Role.ADMIN, Role.PM]), projectController.deleteProject);

export default router;
