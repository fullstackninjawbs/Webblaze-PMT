import { IProposal, Proposal } from './proposal.model';
import { salesCrmConfig } from '../../config/salesCrmConfig';

const getAverage = (obj: any): number => {
  if (!obj || typeof obj !== 'object') return 0;
  const values = Object.values(obj).filter(v => typeof v === 'number') as number[];
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Number((sum / values.length).toFixed(1));
};

export const computeDerivedFields = async (proposal: Partial<IProposal> | any) => {
  const now = new Date();
  
  // 1. JQS & PQS
  if (proposal.jqs) {
    proposal.jobQualityScore = getAverage(proposal.jqs);
    if (proposal.qualifiedOverride !== null && proposal.qualifiedOverride !== undefined) {
      proposal.qualified = proposal.qualifiedOverride;
    } else {
      proposal.qualified = proposal.jobQualityScore >= salesCrmConfig.JQS_QUALIFIED_THRESHOLD;
    }
  }

  if (proposal.pqs) {
    proposal.proposalQualityScore = getAverage(proposal.pqs);
  }

  // 2. Connects
  proposal.totalConnects = (proposal.connectsUsed || 0) + (proposal.boostConnects || 0);

  // 3. Date Applied derived fields
  if (proposal.dateApplied) {
    const dApplied = new Date(proposal.dateApplied);
    
    // Week starting (assuming Monday start)
    const day = dApplied.getDay();
    const diff = dApplied.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(dApplied.setDate(diff));
    weekStart.setHours(0,0,0,0);
    proposal.weekStarting = weekStart;

    // Month
    proposal.month = dApplied.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Day Applied
    proposal.dayApplied = dApplied.toLocaleDateString('en-US', { weekday: 'long' });

    // Days to first response
    if (proposal.replyDate) {
      const msDiff = new Date(proposal.replyDate).getTime() - new Date(proposal.dateApplied).getTime();
      proposal.daysToFirstResponse = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    } else {
      proposal.daysToFirstResponse = null;
    }
    
    // noResponse
    if (proposal.proposalSent && !proposal.clientReplied && !proposal.hired && !proposal.lost) {
      const daysSinceApplied = Math.floor((now.getTime() - new Date(proposal.dateApplied).getTime()) / (1000 * 60 * 60 * 24));
      proposal.noResponse = daysSinceApplied > salesCrmConfig.NO_RESPONSE_DAYS;
    } else {
      proposal.noResponse = false;
    }

    // Follow ups required
    const daysSinceApplied = Math.floor((now.getTime() - new Date(proposal.dateApplied).getTime()) / (1000 * 60 * 60 * 24));
    if (!proposal.clientReplied && proposal.proposalSent) {
      if (daysSinceApplied >= salesCrmConfig.FOLLOW_UP_3_DAYS) {
        proposal.followUpsRequired = 3;
      } else if (daysSinceApplied >= salesCrmConfig.FOLLOW_UP_2_DAYS) {
        proposal.followUpsRequired = 2;
      } else if (daysSinceApplied >= salesCrmConfig.FOLLOW_UP_1_DAYS) {
        proposal.followUpsRequired = 1;
      } else {
        proposal.followUpsRequired = 0;
      }
    } else {
      proposal.followUpsRequired = 0;
    }
  }

  // 4. Follow ups completed
  proposal.followUpsCompleted = [proposal.followUp1Done, proposal.followUp2Done, proposal.followUp3Done].filter(Boolean).length;

  // 5. Current Stage (Priority Order)
  if (proposal.hired) {
    proposal.currentStage = 'won';
  } else if (proposal.lost) {
    proposal.currentStage = 'lost';
  } else if (proposal.offerReceived) {
    proposal.currentStage = 'offer';
  } else if (proposal.interviewScheduled) {
    proposal.currentStage = 'interview';
  } else if (proposal.clientReplied) {
    proposal.currentStage = 'replied';
  } else if (proposal.proposalViewed) {
    proposal.currentStage = 'viewed';
  } else if (proposal.proposalSent) {
    if (proposal.noResponse) {
      proposal.currentStage = 'no_response';
    } else {
      proposal.currentStage = 'sent';
    }
  } else {
    proposal.currentStage = 'applied';
  }

  // 6. Date Closed & Sales Cycle
  if ((proposal.hired || proposal.lost) && !proposal.dateClosed) {
    proposal.dateClosed = new Date();
  }
  
  if (proposal.dateClosed && proposal.dateApplied) {
    const msDiff = new Date(proposal.dateClosed).getTime() - new Date(proposal.dateApplied).getTime();
    proposal.salesCycleDays = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
  }

  // 7. Repeat Client
  if (proposal.clientName) {
    const query: any = { 
      clientName: proposal.clientName, 
      hired: true 
    };
    if (proposal._id) {
      query._id = { $ne: proposal._id };
    }
    const priorWon = await Proposal.exists(query);
    proposal.repeatClient = !!priorWon;
  } else {
    proposal.repeatClient = false;
  }

  return proposal;
};

import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { Role } from '../../types';
import { Project } from '../projects/project.model';
import { ApiError } from '../../utils/ApiError';

export class ProposalService {
  /**
   * List proposals with RBAC scoping and pagination
   */
  static async getProposals(user: any, params: PaginationParams = {}, filters: any = {}): Promise<PaginatedResult<any>> {
    const query: any = { ...filters };

    // Enforce RBAC: Sales Execs can only see their own proposals
    if (user.role === Role.SALES_EXEC) {
      query.salesExec = user._id;
    }

    return paginate(Proposal, query, params, { path: 'salesExec', select: 'name email' });
  }

  /**
   * Get a single proposal by ID with RBAC
   */
  static async getProposalById(id: string, user: any) {
    const query: any = { _id: id };
    if (user.role === Role.SALES_EXEC) {
      query.salesExec = user._id;
    }

    const proposal = await Proposal.findOne(query).populate('salesExec', 'name email').populate('convertedProjectId', 'name');
    if (!proposal) {
      throw new ApiError(404, 'Proposal not found or unauthorized');
    }
    return proposal;
  }

  /**
   * Create a new proposal
   */
  static async createProposal(data: any, userId: string, userRole: Role) {
    // If Sales Exec, enforce salesExec = self
    if (userRole === Role.SALES_EXEC) {
      data.salesExec = userId;
    }
    return Proposal.create(data);
  }

  /**
   * Update an existing proposal
   */
  static async updateProposal(id: string, data: any, user: any) {
    const query: any = { _id: id };
    if (user.role === Role.SALES_EXEC) {
      query.salesExec = user._id;
    }

    const proposal = await Proposal.findOne(query);
    if (!proposal) {
      throw new ApiError(404, 'Proposal not found or unauthorized');
    }

    // Apply updates
    Object.assign(proposal, data);
    
    // Save triggers the pre('save') hook which runs computeDerivedFields
    await proposal.save();
    return proposal;
  }

  /**
   * KPI Summary
   */
  static async getKpiSummary(user: any, dateRange?: { start?: Date; end?: Date }) {
    const matchQuery: any = {};
    if (user.role === Role.SALES_EXEC) {
      matchQuery.salesExec = user._id;
    }
    if (dateRange?.start || dateRange?.end) {
      matchQuery.dateApplied = {};
      if (dateRange.start) matchQuery.dateApplied.$gte = dateRange.start;
      if (dateRange.end) matchQuery.dateApplied.$lte = dateRange.end;
    }

    const proposals = await Proposal.find(matchQuery).lean();

    const won = proposals.filter(p => p.currentStage === 'won').length;
    const lost = proposals.filter(p => p.currentStage === 'lost').length;
    const totalDecided = won + lost;
    const winRate = totalDecided > 0 ? (won / totalDecided) * 100 : 0;

    const wonProposals = proposals.filter(p => p.currentStage === 'won');
    const lostProposals = proposals.filter(p => p.currentStage === 'lost');

    const avgJqsWon = getAverage(wonProposals.map(p => p.jobQualityScore));
    const avgJqsLost = getAverage(lostProposals.map(p => p.jobQualityScore));

    const avgPqsWon = getAverage(wonProposals.map(p => p.proposalQualityScore));
    const avgPqsLost = getAverage(lostProposals.map(p => p.proposalQualityScore));

    const avgSalesCycle = getAverage(wonProposals.map(p => p.salesCycleDays));

    const totalRevenue = wonProposals.reduce((sum, p) => sum + (p.wonRevenue || 0), 0);
    const totalConnectCost = proposals.reduce((sum, p) => sum + (p.connectCost || 0), 0);

    const repeatClients = proposals.filter(p => p.repeatClient).length;
    const repeatClientPercent = proposals.length > 0 ? (repeatClients / proposals.length) * 100 : 0;

    return {
      winRate: Number(winRate.toFixed(1)),
      won,
      lost,
      avgJqsWon,
      avgJqsLost,
      avgPqsWon,
      avgPqsLost,
      avgSalesCycle,
      totalRevenue,
      totalConnectCost,
      repeatClientPercent: Number(repeatClientPercent.toFixed(1))
    };
  }

  /**
   * Follow-up queue
   */
  static async getFollowUpQueue(user: any) {
    const query: any = {
      currentStage: { $nin: ['won', 'lost', 'no_response'] },
      nextFollowUpDate: { $lte: new Date() } // due today or overdue
    };
    if (user.role === Role.SALES_EXEC) {
      query.salesExec = user._id;
    }
    return Proposal.find(query).sort({ nextFollowUpDate: 1 }).populate('salesExec', 'name');
  }

  /**
   * Convert Proposal to Client & Project
   */
  static async convertToProject(id: string, user: any) {
    // Only Admin/Sales Manager allowed, this is enforced at route level via RBAC middleware
    const proposal = await Proposal.findById(id);
    if (!proposal) throw new ApiError(404, 'Proposal not found');
    if (proposal.currentStage !== 'won') throw new ApiError(400, 'Only WON proposals can be converted');
    if (proposal.convertedProjectId) throw new ApiError(400, 'Proposal is already converted');

    // Create project logic
    const newProject = await Project.create({
      name: proposal.jobTitle || 'New Project from Proposal',
      description: proposal.notes || '',
      status: 'new',
      billingType: proposal.jobType === 'hourly' ? 'hourly' : 'fixed',
      totalBudget: proposal.wonRevenue || proposal.estimatedProjectValue || proposal.jobBudget || 0,
      clientName: proposal.clientName || 'Unknown Client',
      // We don't automatically create a client model because standard app behavior uses raw strings for clientName or similar, but we adapt to whatever `Project` needs
      createdBy: user._id
    });

    proposal.convertedProjectId = newProject._id as any;
    await proposal.save();

    return newProject;
  }
}

