import { Router } from 'express';
import {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
} from './milestone.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { PERMISSIONS } from '../../config/permissions';
import { validate } from '../../middlewares/validate.middleware';
import { createMilestoneSchema, updateMilestoneSchema } from './milestone.validation';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Only Admin and PM can manage milestones
router.post(
  '/',
  rbacMiddleware(PERMISSIONS['milestones:manage']),
  validate(createMilestoneSchema),
  createMilestone
);

router.put(
  '/:id',
  rbacMiddleware(PERMISSIONS['milestones:manage']),
  validate(updateMilestoneSchema),
  updateMilestone
);

router.delete(
  '/:id',
  rbacMiddleware(PERMISSIONS['milestones:manage']),
  deleteMilestone
);

// All authenticated users can view milestones (could be further restricted to team members)
router.get('/', getMilestones);
router.get('/:id', getMilestoneById);

export default router;
