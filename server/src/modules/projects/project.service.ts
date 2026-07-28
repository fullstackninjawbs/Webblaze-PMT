import { Project, IProject } from './project.model';
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
        return obj;
      }
      delete project.totalBudget;
    }
    return project;
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
      .populate('team', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return projects.map((p) => this.stripFinancials(p, userRole));
  }

  static async getProjectById(id: string, userRole: Role, userId: string) {
    const project = await Project.findById(id)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) throw new ApiError(404, 'Project not found');

    if (userRole !== Role.ADMIN && userRole !== Role.PM) {
      const isTeamMember = project.team.some((t: any) => t._id.toString() === userId);
      if (!isTeamMember) throw new ApiError(403, 'You do not have access to this project');
    }

    return this.stripFinancials(project, userRole);
  }

  static async updateProject(id: string, data: Partial<IProject>) {
    const project = await Project.findByIdAndUpdate(id, data, { new: true })
      .populate('client', 'name companyName email')
      .populate('team', 'name email role');
      
    if (!project) throw new ApiError(404, 'Project not found');
    return project;
  }

  static async deleteProject(id: string) {
    const project = await Project.findByIdAndDelete(id);
    if (!project) throw new ApiError(404, 'Project not found');
    return project;
  }
}
