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
  getLoggedHoursSummary,
} from './timeLog.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { startTimerSchema, stopTimerSchema, manualLogSchema } from './timeLog.validation';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

const PMS_ROLES = [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER];

// Timers: any PMS user, on tasks they are allowed to work on (checked in the service)
router.post('/start', rbacMiddleware(PMS_ROLES), validate(startTimerSchema), startTimer);
router.post('/stop', rbacMiddleware(PMS_ROLES), validate(stopTimerSchema), stopTimer);
router.post('/manual', rbacMiddleware(PMS_ROLES), validate(manualLogSchema), createManualLog);
router.get('/active', getActiveTimer);

// Team views (scoped per role in the service)
router.get('/team', rbacMiddleware(PMS_ROLES), getTeamTimeLogs);
router.get('/my-eod-summary', getMyEodSummary);
router.get('/team-hours-summary', rbacMiddleware(PMS_ROLES), getTeamHoursSummary);
router.get('/logged-summary', rbacMiddleware(PMS_ROLES), getLoggedHoursSummary);

// Logs for a specific task (scoped in the service)
router.get('/task/:taskId', rbacMiddleware(PMS_ROLES), getTimeLogsByTask);

// Destructive corrections are a management action
router.delete('/task/:taskId/clear', rbacMiddleware([Role.ADMIN, Role.PM]), clearTaskTimeLogs);
router.delete('/:id', rbacMiddleware([Role.ADMIN, Role.PM]), deleteTimeLog);

export default router;
