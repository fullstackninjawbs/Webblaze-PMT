import { Milestone, IMilestone } from './milestone.model';
import { containsRegex } from '../../utils/regex';
import { Project } from '../projects/project.model';
import { Task } from '../tasks/task.model';
import { TimeLog } from '../timelogs/timeLog.model';
import { ApiError } from '../../utils/ApiError';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { canAccessMilestone, canAccessProject, RequestUser } from '../../utils/access';

const roundHours = (hours: number) => Number(hours.toFixed(4));

/**
 * Milestone.spentHours is DERIVED from the milestone's tasks.
 * Milestone.status auto-advances based on task activity, but preserves manual statuses:
 *  - completed    : auto-set when logged hours reach estimate or every task is completed;
 *                   also preserved if set manually.
 *  - in_progress  : auto-set from not_started when any hours are logged or any task starts;
 *                   also preserved if set manually.
 *  - on_hold / cancelled: manual states that are preserved.
 *  - not_started  : default / manual state when no active work is in progress.
 */
export const evaluateAndUpdateMilestoneStatus = async (
  milestoneId: string,
  options?: { preserveStatus?: boolean }
): Promise<IMilestone | null> => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) return null;

  const tasks = await Task.find({ milestone: milestoneId }).select('status spentHours');
  const calculatedSpentHours = roundHours(tasks.reduce((sum, t) => sum + (t.spentHours || 0), 0));

  let newStatus: IMilestone['status'] = milestone.status;

  if (!options?.preserveStatus) {
    const isHoursReached = milestone.estimatedHours > 0 && calculatedSpentHours >= milestone.estimatedHours;
    const areAllTasksCompleted = tasks.length > 0 && tasks.every((t) => t.status === 'completed');
    const hasActivity =
      calculatedSpentHours > 0 || tasks.some((t) => t.status === 'in_progress' || t.status === 'in_review' || t.status === 'rejected');

    if (milestone.status === 'cancelled') {
      newStatus = 'cancelled';
    } else if (milestone.status === 'on_hold') {
      newStatus = 'on_hold';
    } else if (isHoursReached || areAllTasksCompleted) {
      newStatus = 'completed';
    } else if (milestone.status === 'not_started' && hasActivity) {
      newStatus = 'in_progress';
    } else {
      newStatus = milestone.status;
    }
  }

  if (milestone.spentHours !== calculatedSpentHours || milestone.status !== newStatus) {
    milestone.spentHours = calculatedSpentHours;
    milestone.status = newStatus;
    await milestone.save();
  }

  return milestone;
};

const toDayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/**
 * Milestones in a project run in the order they were added. The "previous" milestone is
 * the most recently created one (before `beforeCreatedAt` when editing) that has a date.
 * Its end date is the anchor; if it has no end date, its start date is.
 */
export const getPreviousMilestoneAnchor = async (
  projectId: any,
  excludeId?: string,
  beforeCreatedAt?: Date
): Promise<{ milestone: IMilestone; anchor: Date; basis: 'end' | 'start' } | null> => {
  const query: any = {
    project: projectId,
    $or: [{ endDate: { $ne: null } }, { startDate: { $ne: null } }],
  };
  if (excludeId) query._id = { $ne: excludeId };
  if (beforeCreatedAt) query.createdAt = { $lt: beforeCreatedAt };

  const previous = await Milestone.findOne(query).sort({ createdAt: -1 });
  if (!previous) return null;

  if (previous.endDate) return { milestone: previous, anchor: previous.endDate, basis: 'end' };
  if (previous.startDate) return { milestone: previous, anchor: previous.startDate, basis: 'start' };
  return null;
};

const assertStartDateFollowsPrevious = async (
  projectId: any,
  startDate: Date | string | undefined | null,
  options: { excludeId?: string; beforeCreatedAt?: Date; requireWhenAnchored: boolean }
) => {
  const previous = await getPreviousMilestoneAnchor(projectId, options.excludeId, options.beforeCreatedAt);
  if (!previous) return;

  const anchorLabel = `${previous.basis} date of "${previous.milestone.title}" (${toDayKey(previous.anchor)})`;

  if (!startDate) {
    if (options.requireWhenAnchored) {
      throw new ApiError(400, `Start date is required and must be after the ${anchorLabel}`);
    }
    return;
  }

  if (toDayKey(startDate) <= toDayKey(previous.anchor)) {
    throw new ApiError(400, `Start date must be after the ${anchorLabel}`);
  }
};

export const getAllocatedHours = async (milestoneId: string, excludeTaskId?: string): Promise<number> => {
  const query: any = { milestone: milestoneId };
  if (excludeTaskId) query._id = { $ne: excludeTaskId };
  const tasks = await Task.find(query).select('estimatedHours');
  return tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
};

export const createMilestone = async (data: Partial<IMilestone>): Promise<IMilestone> => {
  const project = await Project.findById(data.project);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.status === 'completed') {
    throw new ApiError(400, 'Cannot add milestones to a completed project');
  }

  // spentHours is derived; never trust it from the client
  const { spentHours: _ignored, ...safeData } = data as any;

  await assertStartDateFollowsPrevious(project._id, safeData.startDate, { requireWhenAnchored: true });

  return Milestone.create(safeData);
};

export const getMilestonesByProject = async (
  projectId: string,
  params: PaginationParams = {},
  user?: RequestUser
): Promise<PaginatedResult<IMilestone>> => {
  if (user && !(await canAccessProject(user, projectId))) {
    throw new ApiError(403, 'You do not have access to this project');
  }

  const filter: any = { project: projectId };
  if (params.status && params.status !== 'all') filter.status = params.status;
  if (params.search) filter.title = { $regex: containsRegex(params.search) };

  const result = await paginate(Milestone, filter, params);

  // Sync derived fields so the list is never stale
  const updatedMilestones = await Promise.all(
    result.data.map(async (m) => {
      const updated = await evaluateAndUpdateMilestoneStatus(String(m._id));
      return updated || m;
    })
  );

  result.data = updatedMilestones;
  return result;
};

export const getMilestoneById = async (id: string, user?: RequestUser): Promise<IMilestone> => {
  if (user && !(await canAccessMilestone(user, id))) {
    throw new ApiError(403, 'You do not have access to this milestone');
  }
  await evaluateAndUpdateMilestoneStatus(id);
  // Only non-financial project fields: budget and payments must not reach team roles
  const milestone = await Milestone.findById(id).populate('project', 'name status client type team');
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
  return milestone;
};

export const updateMilestone = async (id: string, updateData: Partial<IMilestone>): Promise<IMilestone> => {
  const existing = await Milestone.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Milestone not found');
  }

  // spentHours is derived; never trust it from the client. Project cannot be changed.
  const { spentHours: _ignored, project: _ignoredProject, ...safeData } = updateData as any;

  // A milestone cannot shrink below the hours already allocated to its tasks
  if (safeData.estimatedHours !== undefined && safeData.estimatedHours !== existing.estimatedHours) {
    const allocated = await getAllocatedHours(id);
    if (Math.round(safeData.estimatedHours * 60) < Math.round(allocated * 60)) {
      throw new ApiError(
        400,
        `Milestone estimate cannot be below the ${allocated}h already allocated to its tasks`
      );
    }
  }

  if ('startDate' in safeData && safeData.startDate !== undefined) {
    await assertStartDateFollowsPrevious(existing.project, safeData.startDate, {
      excludeId: id,
      beforeCreatedAt: existing.createdAt,
      requireWhenAnchored: false,
    });
  }

  const milestone = await Milestone.findByIdAndUpdate(id, safeData, {
    new: true,
    runValidators: true,
  });
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  const evaluated = await evaluateAndUpdateMilestoneStatus(
    id,
    safeData.status !== undefined ? { preserveStatus: true } : undefined
  );
  return evaluated || milestone;
};

export const deleteMilestone = async (id: string): Promise<void> => {
  const milestone = await Milestone.findById(id);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  // Cascade: a milestone owns its tasks, and tasks own their time logs. Never leave orphans.
  const taskIds = await Task.find({ milestone: id }).distinct('_id');
  if (taskIds.length > 0) {
    await TimeLog.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ _id: { $in: taskIds } });
  }

  await milestone.deleteOne();
};
