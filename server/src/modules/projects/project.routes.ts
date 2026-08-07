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

// All user roles can create, update, and delete projects
router.post('/', validate(createProjectSchema), projectController.createProject);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
