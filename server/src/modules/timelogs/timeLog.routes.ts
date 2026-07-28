import { Router } from 'express';
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTimeLogsByTask,
  getTeamTimeLogs,
} from './timeLog.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { startTimerSchema, stopTimerSchema } from './timeLog.validation';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

// Any authenticated user can start/stop their own timer
router.post('/start', validate(startTimerSchema), startTimer);
router.post('/stop', validate(stopTimerSchema), stopTimer);
router.get('/active', getActiveTimer);

// Admin/PM only team view
router.get('/team', rbacMiddleware([Role.ADMIN, Role.PM]), getTeamTimeLogs);

// View logs for a specific task
router.get('/task/:taskId', getTimeLogsByTask);

export default router;
