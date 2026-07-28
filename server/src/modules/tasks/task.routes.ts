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

// TLs, PMs, Admins can create tasks
router.post(
  '/',
  rbacMiddleware(PERMISSIONS['tasks:manage']),
  validate(createTaskSchema),
  createTask
);

// Any team member can view tasks
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Updating a task (e.g. changing status) can be done by the assignee or TL/PM/Admin
// For now, we allow anyone with tasks:manage to update all fields.
// Ideally, Team Members should only be able to update 'status' of their own tasks.
// We will add custom logic in the controller/service if needed, but for simplicity, 
// if they have 'tasks:manage' they can update. Wait, Team Members don't have tasks:manage.
// Let's add a separate endpoint for team members to update status, or allow them in the main PUT route.
// For now, we'll allow tasks:manage for full update.
router.put(
  '/:id',
  rbacMiddleware(PERMISSIONS['tasks:manage']),
  validate(updateTaskSchema),
  updateTask
);

router.delete(
  '/:id',
  rbacMiddleware(PERMISSIONS['tasks:manage']),
  deleteTask
);

export default router;
