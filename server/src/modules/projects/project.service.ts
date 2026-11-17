import { Project, IProject } from './project.model';
import { containsRegex } from '../../utils/regex';
import { Milestone } from '../milestones/milestone.model';
import { Task } from '../tasks/task.model';
import { TimeLog } from '../timelogs/timeLog.model';
import { Release } from '../releases/release.model';
import { Invoice } from '../invoices/invoice.model';
import { DailyStatus } from '../daily-status/dailyStatus.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { getAccessibleProjectIds, getUserId, isProjectScopedRole } from '../../utils/access';

export class ProjectService {
  /**
   * Strips sensitive financial data from a project based on user role
   */
  static stripFinancials(project: any, userRole: Role) {
    if (userRole !== Role.ADMIN && userRole !== Role.PM) {
      if (project.toObject) {
        const obj = project.toObject();
        delete obj.totalBudget;
        delete obj.costPerHour;
        delete obj.totalHours;
        delete obj.receivedAmount;
        delete obj.pendingAmount;
        return obj;
      }
      delete project.totalBudget;
      delete project.costPerHour;
      delete project.totalHours;
      delete project.receivedAmount;
      delete project.pendingAmount;
    }
    return project;
  }

  static async attachProgress(project: any) {
    const milestones = await Milestone.find({ project: project._id });
    const estHours = milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);
    const spentHours = Number(milestones.reduce((sum, m) => sum + (m.spentHours || 0), 0).toFixed(4));
    const progress = estHours > 0 ? Math.min(Math.round((spentHours / estHours) * 100), 100) : 0;

    const obj = project.toObject ? project.toObject() : project;
    return {
      ...obj,
      progress,
      estHours,
      spentHours
    };
  }

  static async createProject(data: Partial<IProject>, userId: string) {
    return Project.create({ ...data, createdBy: userId });
  }

  static async getProjects(user: any, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const query: any = {};
    const userRole = user.role;

    let allowedDeptRegexes: RegExp[] = [];
    if (isProjectScopedRole(userRole)) {
      // TL/TM only see projects they belong to: in the team array OR holding a task assigned to them
      const accessibleIds = await getAccessibleProjectIds(user);
      query._id = { $in: accessibleIds };

      if (user.department) {
        const deptVariants = normalizeDept(user.department);
        allowedDeptRegexes = deptVariants.map((d) => new RegExp(d, 'i'));
      }
    }

    if (params.status && params.status !== 'all') {
      query.status = params.status;
    }
    
    if (params.department && params.department !== 'all') {
      // If user is TL/TM, they already have a type filter. We should only narrow it down if allowed.
      // But for Admin/PM, they can filter by any department.
      if (userRole === Role.ADMIN || userRole === Role.PM) {
        query.type = { $regex: containsRegex(params.department) };
      } else if (allowedDeptRegexes.some(r => r.test(String(params.department)))) {
        query.type = { $regex: containsRegex(params.department) };
      }
    }

    if (params.search) {
      query.name = { $regex: containsRegex(params.search) };
    }

    const populateOptions = [
      { path: 'client', select: 'name companyName email' },
      { path: 'team', select: 'name email role department avatarUrl' },
      { path: 'createdBy', select: 'name email' }
    ];

    const paginatedResult = await paginate(Project, query, params, populateOptions);

    const projectsWithProgress = await Promise.all(
      paginatedResult.data.map(p => this.attachProgress(p))
    );

    paginatedResult.data = projectsWithProgress.map((p) => {
      let result = this.stripFinancials(p, userRole);

      // Filter team array to only show matching department for TL/TM
      if (userRole === Role.TEAM_LEAD || userRole === Role.TEAM_MEMBER) {
        if (result.team && allowedDeptRegexes.length > 0) {
          result.team = result.team.filter((t: any) => {
            if (!t.department) return false;
            return allowedDeptRegexes.some(r => r.test(t.department)) || t.department === user.department;
          });
        }
      }
      return result;
    });

    // Calculate global KPI sums across ALL matching projects (ignoring pagination limits)
    // We only need this if the user is PM/Admin, but we can compute it for all or skip if TL/TM
    let kpiSums = { activeCount: 0, totalBudgetSum: 0, totalReceivedSum: 0, totalPendingSum: 0 };
    if (userRole === Role.ADMIN || userRole === Role.PM) {
      const allMatching = await Project.find(query);
      kpiSums.activeCount = allMatching.filter(p => p.status === 'active').length;
      kpiSums.totalBudgetSum = allMatching.reduce((s, p) => s + (p.totalBudget || 0), 0);
      kpiSums.totalReceivedSum = allMatching.reduce((s, p) => s + (p.receivedAmount || 0), 0);
      kpiSums.totalPendingSum = allMatching.reduce((s, p) => s + (p.pendingAmount || 0), 0);
    }

    paginatedResult.meta = {
      ...paginatedResult.meta,
      ...kpiSums
    };

    return paginatedResult;
  }

  static async getProjectById(id: string, user: any) {
    const userRole = user.role;
    const project = await Project.findById(id)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl')
      .populate('createdBy', 'name email');

    if (!project) throw new ApiError(404, 'Project not found');

    if (isProjectScopedRole(userRole)) {
      const userId = getUserId(user);
      const isInTeam = project.team.some((member: any) => String(member._id) === userId);

      if (!isInTeam) {
        const accessibleIds = await getAccessibleProjectIds(user);
        const hasAssignedTask = accessibleIds.some((pid) => String(pid) === String(project._id));
        if (!hasAssignedTask) {
          throw new ApiError(403, 'You do not have access to this project (not assigned to team)');
        }
      }
    }

    const projectWithProgress = await this.attachProgress(project);
    return this.stripFinancials(projectWithProgress, userRole);
  }

  static async updateProject(id: string, data: Partial<IProject>) {
    const project = await Project.findByIdAndUpdate(id, data, { new: true })
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl');

    if (!project) throw new ApiError(404, 'Project not found');
    return project;
  }

  static async deleteProject(id: string) {
    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, 'Project not found');

    const milestones = await Milestone.find({ project: id });
    const milestoneIds = milestones.map(m => m._id);

    const tasks = await Task.find({ milestone: { $in: milestoneIds } });
    const taskIds = tasks.map(t => t._id);

    if (taskIds.length > 0) {
      await TimeLog.deleteMany({ task: { $in: taskIds } });
    }

    if (milestoneIds.length > 0) {
      await Task.deleteMany({ milestone: { $in: milestoneIds } });
    }

    await Milestone.deleteMany({ project: id });
    await Release.deleteMany({ project: id });
    await Invoice.deleteMany({ project: id });
    await DailyStatus.deleteMany({ project: id });

    await project.deleteOne();
    return project;
  }
}
