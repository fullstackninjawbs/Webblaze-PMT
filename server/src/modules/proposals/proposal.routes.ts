import { Router, Request, Response, NextFunction } from 'express';
import { ProposalController } from './proposal.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { isProposalAuthorized, isSalesManagerOrLead } from './proposal.service';
import { ApiError } from '../../utils/ApiError';

const router = Router();

// Protect all routes with authentication
router.use(authMiddleware);

// Middleware checking proposal CRM access (Sales members, Sales Team Leads, Admin)
const proposalAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!isProposalAuthorized(user)) {
    throw new ApiError(403, 'Forbidden: Only sales team members, sales team leads, and admins can access proposals', 'FORBIDDEN');
  }
  next();
};

// Middleware checking conversion access (Sales Team Leads, Admin)
const proposalConvertMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!isSalesManagerOrLead(user)) {
    throw new ApiError(403, 'Forbidden: Only sales team leads and admins can convert proposals to projects', 'FORBIDDEN');
  }
  next();
};

// All proposal routes require proposal access
router.use(proposalAccessMiddleware);

// KPI Summary - Must be placed before /:id routes
router.get('/kpi-summary', ProposalController.getKpiSummary);

// Follow up queue - Must be placed before /:id routes
router.get('/follow-up-queue', ProposalController.getFollowUpQueue);

// List Proposals
router.get('/', ProposalController.getProposals);

// Create Proposal
router.post('/', ProposalController.createProposal);

// Get Single Proposal
router.get('/:id', ProposalController.getProposal);

// Update Proposal
router.patch('/:id', ProposalController.updateProposal);

// Delete Proposal
router.delete('/:id', ProposalController.deleteProposal);

// Convert to Project
router.post('/:id/convert', proposalConvertMiddleware, ProposalController.convertToProject);

export const proposalRoutes = router;

