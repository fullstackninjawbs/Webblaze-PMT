import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from './task.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';
import { validate } from '../../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from './task.validation';

const router = Router();

router.use(authMiddleware);

// Admin, PM, Team Lead can create tasks
router.post(
  '/',
  rbacMiddleware(PERMISSIONS['tasks:manage']),
  validate(createTaskSchema),
  createTask
);

// Any team member can view tasks
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Updating a task (status, work summary, details) can be done by ADMIN, PM, TL, or assigned TEAM_MEMBER
router.put(
  '/:id',
  validate(updateTaskSchema),
  updateTask
);

router.delete(
  '/:id',
  rbacMiddleware(PERMISSIONS['tasks:manage']),
  deleteTask
);

export default router;
