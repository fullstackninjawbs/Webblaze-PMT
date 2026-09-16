import { Router } from 'express';
import { ProposalController } from './proposal.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { Role } from '../../types';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// KPI Summary - Must be placed before /:id routes
router.get(
  '/kpi-summary',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.getKpiSummary
);

// Follow up queue - Must be placed before /:id routes
router.get(
  '/follow-up-queue',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.getFollowUpQueue
);

// List Proposals
router.get(
  '/',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.getProposals
);

// Create Proposal
router.post(
  '/',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.createProposal
);

// Get Single Proposal
router.get(
  '/:id',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.getProposal
);

// Update Proposal
router.patch(
  '/:id',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER, Role.SALES_EXEC]),
  ProposalController.updateProposal
);

// Convert to Project
router.post(
  '/:id/convert',
  rbacMiddleware([Role.ADMIN, Role.SALES_MANAGER]), // SALES_EXEC not allowed to convert directly
  ProposalController.convertToProject
);

export const proposalRoutes = router;
