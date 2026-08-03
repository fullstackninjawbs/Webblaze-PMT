import { Project, IProject } from './project.model';
import { Milestone } from '../milestones/milestone.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';

export class ProjectService {
  /**
   * Strips sensitive financial data from a project based on user role
   */
  static stripFinancials(project: any, userRole: Role) {
    if (userRole !== Role.ADMIN && userRole !== Role.PM) {
      if (project.toObject) {
        const obj = project.toObject();
        delete obj.totalBudget;
        delete obj.receivedAmount;
        delete obj.pendingAmount;
        return obj;
      }
      delete project.totalBudget;
      delete project.receivedAmount;
      delete project.pendingAmount;
    }
    return project;
  }

  static async attachProgress(project: any) {
    const milestones = await Milestone.find({ project: project._id });
    const estHours = milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);
    const spentHours = milestones.reduce((sum, m) => sum + (m.spentHours || 0), 0);
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

  static async getProjects(userRole: Role, userId: string) {
    let query = {};
    // If not Admin/PM, only show projects they are assigned to
    if (userRole !== Role.ADMIN && userRole !== Role.PM) {
      query = { team: userId };
    }

    const projects = await Project.find(query)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(p => this.attachProgress(p))
    );

    return projectsWithProgress.map((p) => this.stripFinancials(p, userRole));
  }

  static async getProjectById(id: string, userRole: Role, userId: string) {
    const project = await Project.findById(id)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl')
      .populate('createdBy', 'name email');

    if (!project) throw new ApiError(404, 'Project not found');

    if (userRole !== Role.ADMIN && userRole !== Role.PM) {
      const isTeamMember = project.team.some((t: any) => t._id.toString() === userId);
      if (!isTeamMember) throw new ApiError(403, 'You do not have access to this project');
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
    const project = await Project.findByIdAndDelete(id);
    if (!project) throw new ApiError(404, 'Project not found');
    return project;
  }
}
