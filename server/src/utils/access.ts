import { Types } from 'mongoose';
import { Project } from '../modules/projects/project.model';
import { Milestone } from '../modules/milestones/milestone.model';
import { Task } from '../modules/tasks/task.model';
import { Role } from '../types';

export interface RequestUser {
  id?: string;
  _id?: any;
  role: Role;
  department?: string;
}

export const getUserId = (user: RequestUser): string => String(user.id || user._id);

/** Team Lead and Team Member only ever see the projects they are part of. */
export const isProjectScopedRole = (role?: Role): boolean =>
  role === Role.TEAM_LEAD || role === Role.TEAM_MEMBER;

/**
 * Projects a scoped user may access: projects where they are in the team array
 * OR projects that contain a task assigned to them. The second condition means an
 * assignment alone is enough to make the project visible, even if the PM forgot to
 * add the person to the project team.
 */
export const getAccessibleProjectIds = async (user: RequestUser): Promise<Types.ObjectId[]> => {
  const userId = getUserId(user);

  const [teamProjects, assignedMilestoneIds] = await Promise.all([
    Project.find({ team: userId }).select('_id').lean(),
    Task.find({ assignedTo: userId }).distinct('milestone'),
  ]);

  const assignedProjectIds: Types.ObjectId[] =
    assignedMilestoneIds.length > 0
      ? await Milestone.find({ _id: { $in: assignedMilestoneIds } }).distinct('project')
      : [];

  const unique = new Map<string, Types.ObjectId>();
  for (const p of teamProjects) unique.set(String(p._id), p._id as Types.ObjectId);
  for (const id of assignedProjectIds) unique.set(String(id), id);

  return Array.from(unique.values());
};

export const canAccessProject = async (user: RequestUser, projectId: any): Promise<boolean> => {
  if (!isProjectScopedRole(user.role)) return true;
  const ids = await getAccessibleProjectIds(user);
  return ids.some((id) => String(id) === String(projectId));
};

/** Resolves the project id that owns a milestone, or null if the milestone is missing. */
export const getProjectIdForMilestone = async (milestoneId: any): Promise<Types.ObjectId | null> => {
  const milestone = await Milestone.findById(milestoneId).select('project').lean();
  return milestone ? (milestone.project as Types.ObjectId) : null;
};

export const canAccessMilestone = async (user: RequestUser, milestoneId: any): Promise<boolean> => {
  if (!isProjectScopedRole(user.role)) return true;
  const projectId = await getProjectIdForMilestone(milestoneId);
  if (!projectId) return false;
  return canAccessProject(user, projectId);
};
