import express from 'express';
import * as releaseController from './release.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createReleaseSchema, updateReleaseSchema } from './release.validation';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { Role } from '../../types';

const router = express.Router();

// All release routes require authentication
router.use(authMiddleware);

router.post(
  '/',
  rbacMiddleware([Role.ADMIN, Role.PM, Role.TEAM_LEAD]),
  validate(createReleaseSchema),
  releaseController.createRelease
);

router.get('/', releaseController.getReleases);
router.get('/:id', releaseController.getReleaseById);

router.put(
  '/:id',
  rbacMiddleware([Role.ADMIN, Role.PM, Role.TEAM_LEAD]),
  validate(updateReleaseSchema),
  releaseController.updateRelease
);

router.delete(
  '/:id',
  rbacMiddleware([Role.ADMIN, Role.PM]),
  releaseController.deleteRelease
);

export default router;
