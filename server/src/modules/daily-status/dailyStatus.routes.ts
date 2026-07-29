import { Router } from 'express';
import {
  createDailyStatus,
  getMyDailyStatuses,
  getTeamDailyStatuses
} from './dailyStatus.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createDailyStatusSchema } from './dailyStatus.validation';
import { Role } from '../../types';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createDailyStatusSchema), createDailyStatus);
router.get('/my', getMyDailyStatuses);

// Only Admin, PM, and Team Leads can view other members' status reports
router.get('/team', rbacMiddleware([Role.ADMIN, Role.PM, Role.TEAM_LEAD]), getTeamDailyStatuses);

export default router;
