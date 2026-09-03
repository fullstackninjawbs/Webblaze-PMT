import { Router } from 'express';
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTimeLogsByTask,
  getTeamTimeLogs,
  getTeamHoursSummary,
  createManualLog,
  deleteTimeLog,
  clearTaskTimeLogs,
  getMyEodSummary,
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
router.post('/manual', createManualLog);
router.get('/active', getActiveTimer);

// Admin/PM/TeamLead/TeamMember team view
router.get('/team', rbacMiddleware([Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER]), getTeamTimeLogs);
router.get('/my-eod-summary', getMyEodSummary);
router.get('/team-hours-summary', rbacMiddleware([Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER]), getTeamHoursSummary);

// View & Clear logs for a specific task
router.get('/task/:taskId', getTimeLogsByTask);
router.delete('/task/:taskId/clear', clearTaskTimeLogs);
router.delete('/:id', deleteTimeLog);

export default router;
