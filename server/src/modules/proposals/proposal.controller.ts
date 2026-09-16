import { Request, Response, NextFunction } from 'express';
import { ProposalService } from './proposal.service';
import { ApiError } from '../../utils/ApiError';
import { createProposalSchema, updateProposalSchema } from './proposal.validation';

export class ProposalController {
  static async getProposals(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortField = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
      
      const filters = { ...req.query };
      delete filters.page;
      delete filters.limit;
      delete filters.sortBy;
      delete filters.sortOrder;

      const result = await ProposalService.getProposals((req as any).user, { page, limit, sortField, sortOrder }, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const proposal = await ProposalService.getProposalById(req.params.id, (req as any).user);
      res.json(proposal);
    } catch (error) {
      next(error);
    }
  }

  static async createProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = createProposalSchema.parse(req.body);
      const proposal = await ProposalService.createProposal(parsedData, (req as any).user._id, (req as any).user.role);
      res.status(201).json(proposal);
    } catch (error) {
      next(error);
    }
  }

  static async updateProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = updateProposalSchema.parse(req.body);
      const proposal = await ProposalService.updateProposal(req.params.id, parsedData, (req as any).user);
      res.json(proposal);
    } catch (error) {
      next(error);
    }
  }

  static async getKpiSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const result = await ProposalService.getKpiSummary((req as any).user, { start: startDate, end: endDate });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getFollowUpQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await ProposalService.getFollowUpQueue((req as any).user);
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }

  static async convertToProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await ProposalService.convertToProject(req.params.id, (req as any).user);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
}
