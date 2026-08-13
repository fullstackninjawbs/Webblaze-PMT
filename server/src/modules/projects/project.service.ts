import { Project, IProject } from './project.model';
import { Milestone } from '../milestones/milestone.model';
import { Task } from '../tasks/task.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';

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

  static async getProjects(user: any) {
    const query: any = {};
    const userRole = user.role;

    let allowedDeptRegexes: RegExp[] = [];
    if (userRole === Role.TEAM_LEAD || userRole === Role.TEAM_MEMBER) {
      if (user.department) {
        const deptVariants = normalizeDept(user.department);
        allowedDeptRegexes = deptVariants.map((d) => new RegExp(d, 'i'));
        
        // Find tasks matching department to get accessible projects
        const deptTasks = await Task.find({ 
          $or: [
            { department: { $in: allowedDeptRegexes } },
            { department: user.department }
          ]
        }).select('milestone');
        
        const milestoneIds = deptTasks.map(t => t.milestone);
        const milestones = await Milestone.find({ _id: { $in: milestoneIds } }).select('project');
        const projectIds = milestones.map(m => m.project);
        
        query._id = { $in: projectIds };
      } else {
        // Fallback for TL/TM with no department: they see nothing
        query._id = null;
      }
    }

    const projects = await Project.find(query)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(p => this.attachProgress(p))
    );

    return projectsWithProgress.map((p) => {
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
  }

  static async getProjectById(id: string, user: any) {
    const userRole = user.role;
    const project = await Project.findById(id)
      .populate('client', 'name companyName email')
      .populate('team', 'name email role department avatarUrl')
      .populate('createdBy', 'name email');

    if (!project) throw new ApiError(404, 'Project not found');

    let allowedDeptRegexes: RegExp[] = [];
    if (userRole === Role.TEAM_LEAD || userRole === Role.TEAM_MEMBER) {
      if (!user.department) {
         throw new ApiError(403, 'You do not have access to this project (no department assigned)');
      }
      
      const deptVariants = normalizeDept(user.department);
      allowedDeptRegexes = deptVariants.map((d) => new RegExp(d, 'i'));
      
      const milestones = await Milestone.find({ project: id }).select('_id');
      const milestoneIds = milestones.map((m) => m._id);
      
      const hasDeptTask = await Task.exists({ 
        milestone: { $in: milestoneIds },
        $or: [
          { department: { $in: allowedDeptRegexes } },
          { department: user.department }
        ]
      });
      
      if (!hasDeptTask) {
        throw new ApiError(403, 'You do not have access to this project (no tasks in your department)');
      }
    }

    const projectWithProgress = await this.attachProgress(project);
    let result = this.stripFinancials(projectWithProgress, userRole);
    
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
