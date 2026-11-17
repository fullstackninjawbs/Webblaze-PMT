import { Task, ITask } from './task.model';
import { containsRegex } from '../../utils/regex';
import { Milestone } from '../milestones/milestone.model';
import { Project } from '../projects/project.model';
import { User } from '../users/user.model';
import { TimeLog } from '../timelogs/timeLog.model';
import { evaluateAndUpdateMilestoneStatus, getAllocatedHours } from '../milestones/milestone.service';
import { startTimer, stopActiveTimersForTask } from '../timelogs/timeLog.service';
import { sendTaskAssignmentEmail, sendTaskStatusChangeEmail } from '../../utils/emailService';
import { ApiError } from '../../utils/ApiError';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { Role } from '../../types';
import {
  canAccessMilestone,
  getAccessibleProjectIds,
  getUserId,
  isProjectScopedRole,
  RequestUser,
} from '../../utils/access';

type TaskStatus = ITask['status'];

const toId = (value: any): string | null => {
  if (!value) return null;
  return typeof value === 'object' ? String(value._id ?? value) : String(value);
};

/** Sum of sibling task estimates + this task must stay within the milestone estimate. */
const enforceHourCap = async (milestoneId: string, estimatedHours: number, currentTaskId?: string) => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  const allocated = await getAllocatedHours(milestoneId, currentTaskId);
  // Compare in whole minutes: 1.1 + 2.2 is 3.3000000000000003 in floating point
  const toMinutes = (h: number) => Math.round((h || 0) * 60);
  if (toMinutes(allocated) + toMinutes(estimatedHours) > toMinutes(milestone.estimatedHours)) {
    throw new ApiError(
      400,
      `Task exceeds milestone estimated hours. Milestone budget: ${milestone.estimatedHours}h, already allocated: ${allocated}h, this task: ${estimatedHours}h`
    );
  }
};

/** A person assigned to a task automatically belongs to the project team. */
const ensureAssigneeOnProjectTeam = async (milestoneId: any, assigneeId: any) => {
  if (!milestoneId || !assigneeId) return;
  const milestone = await Milestone.findById(milestoneId).select('project');
  if (!milestone) return;
  await Project.updateOne({ _id: milestone.project }, { $addToSet: { team: assigneeId } });
};

/** Milestone ids visible to the user, for scoping task lists. */
const getAccessibleMilestoneIds = async (user: RequestUser) => {
  const projectIds = await getAccessibleProjectIds(user);
  return Milestone.find({ project: { $in: projectIds } }).distinct('_id');
};

const notifyAssignment = async (task: ITask) => {
  const assigneeId = toId(task.assignedTo);
  if (!assigneeId) return;
  const assignedUser = await User.findById(assigneeId);
  if (!assignedUser?.email) return;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  sendTaskAssignmentEmail({
    to: assignedUser.email,
    assigneeName: assignedUser.name,
    taskTitle: task.title,
    taskDescription: task.description,
    estimatedHours: task.estimatedHours,
    department: task.department,
    taskUrl: `${clientUrl}/tasks/${task._id}`,
  }).catch((err) => console.error('Task assignment email error:', err));
};

const notifyStatusChange = async (task: ITask, oldStatus: TaskStatus, newStatus: TaskStatus) => {
  const assigneeId = toId(task.assignedTo);
  if (!assigneeId) return;
  const assignedUser = await User.findById(assigneeId);
  if (!assignedUser?.email) return;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  sendTaskStatusChangeEmail({
    to: assignedUser.email,
    recipientName: assignedUser.name,
    taskTitle: task.title,
    oldStatus,
    newStatus,
    taskUrl: `${clientUrl}/tasks/${task._id}`,
  }).catch((err) => console.error('Task status change email error:', err));
};

export const createTask = async (data: Partial<ITask>, user?: RequestUser): Promise<ITask> => {
  if (!data.milestone) {
    throw new ApiError(400, 'Milestone is required');
  }

  // The creator must already have access to the milestone's project. Without this, a team
  // member could create a task anywhere and, by assigning themselves, be added to that team.
  if (user && !(await canAccessMilestone(user, data.milestone))) {
    throw new ApiError(403, 'You do not have access to this milestone');
  }

  const milestone = await Milestone.findById(data.milestone).populate('project');
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
  const project = milestone.project as any;
  if (project?.status === 'completed') {
    throw new ApiError(400, 'Cannot add tasks to a completed project');
  }
  if (milestone.status === 'completed' || milestone.status === 'cancelled') {
    throw new ApiError(400, `Cannot add tasks to a ${milestone.status} milestone`);
  }

  await enforceHourCap(String(milestone._id), data.estimatedHours!);

  // Derived fields are never accepted from the client
  const { spentHours: _spent, status: requestedStatus, ...safeData } = data as any;

  // Work statuses cannot be skipped to on creation, except by Admin / PM
  const isManager = !user || user.role === Role.ADMIN || user.role === Role.PM;
  if (!isManager && ['in_progress', 'in_review', 'completed'].includes(requestedStatus)) {
    throw new ApiError(403, `Only PM or Admin can create a task as ${String(requestedStatus).replace('_', ' ')}`);
  }

  // Status follows assignment; an explicit on_hold (or a manager's choice) is kept
  const assignmentStatus = safeData.assignedTo ? 'assigned' : 'unassigned';
  safeData.status =
    !requestedStatus || requestedStatus === 'assigned' || requestedStatus === 'unassigned'
      ? assignmentStatus
      : requestedStatus;
  safeData.spentHours = 0;

  const task = await Task.create(safeData);

  await ensureAssigneeOnProjectTeam(task.milestone, task.assignedTo);
  await evaluateAndUpdateMilestoneStatus(String(task.milestone));
  await notifyAssignment(task);

  return task;
};

export const getTasksByMilestone = async (
  milestoneId: string,
  user?: RequestUser,
  params: PaginationParams = {}
): Promise<PaginatedResult<ITask>> => {
  if (user && !(await canAccessMilestone(user, milestoneId))) {
    throw new ApiError(403, 'You do not have access to this milestone');
  }

  const query: any = { milestone: milestoneId };
  if (params.status && params.status !== 'all') query.status = params.status;
  if (params.search) query.title = { $regex: containsRegex(params.search) };

  return paginate(Task, query, params, [
    { path: 'assignedTo', select: 'name email avatarUrl role department' },
  ]);
};

export const getTasksByUser = async (
  userId: string,
  params: PaginationParams = {},
  requester?: RequestUser
): Promise<PaginatedResult<ITask>> => {
  // A team member can only list their own tasks
  if (requester?.role === Role.TEAM_MEMBER && getUserId(requester) !== String(userId)) {
    throw new ApiError(403, 'You can only view your own tasks');
  }

  const query: any = { assignedTo: userId };
  // Viewing someone else's tasks: only within projects the requester can access
  if (requester && isProjectScopedRole(requester.role) && getUserId(requester) !== String(userId)) {
    query.milestone = { $in: await getAccessibleMilestoneIds(requester) };
  }
  if (params.status && params.status !== 'all') query.status = params.status;
  if (params.search) query.title = { $regex: containsRegex(params.search) };

  return paginate(Task, query, params, [
    { path: 'assignedTo', select: 'name email avatarUrl role department' },
    { path: 'milestone', populate: { path: 'project', select: 'name client type' } },
  ]);
};

export const getAllTasks = async (user?: RequestUser, params: PaginationParams = {}): Promise<PaginatedResult<ITask>> => {
  const query: any = {};

  if (user && isProjectScopedRole(user.role)) {
    query.milestone = { $in: await getAccessibleMilestoneIds(user) };
  }

  if (params.status && params.status !== 'all') query.status = params.status;
  if (params.search) query.title = { $regex: containsRegex(params.search) };
  if (params.department && params.department !== 'all') {
    query.department = { $regex: containsRegex(params.department) };
  }
  if (params.userId && params.userId !== 'all') query.assignedTo = params.userId;

  return paginate(Task, query, params, [
    { path: 'assignedTo', select: 'name email avatarUrl role department' },
    { path: 'milestone', populate: { path: 'project', select: 'name client type' } },
  ]);
};

export const getTaskById = async (id: string, user?: RequestUser): Promise<ITask> => {
  const task = await Task.findById(id)
    .populate('assignedTo', 'name email avatarUrl role')
    .populate({ path: 'attachments', populate: { path: 'uploadedBy', select: 'name' } });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (user && task.milestone && !(await canAccessMilestone(user, task.milestone))) {
    throw new ApiError(403, 'Forbidden: You do not have access to this project/task');
  }

  return task;
};

/**
 * Status and timers are coupled:
 *  - the assignee moving a task to in_progress starts their timer on it
 *  - any move away from in_progress stops every running timer on the task
 *  - only Admin / PM may mark a task completed (checked in the controller)
 */
export const updateTask = async (id: string, updateData: Partial<ITask>, user?: RequestUser): Promise<ITask> => {
  const task = await getTaskById(id, user);
  const actorId = user ? getUserId(user) : null;
  const previousAssigneeId = toId(task.assignedTo);
  const previousStatus = task.status;

  if (user?.role === Role.TEAM_MEMBER) {
    if (!previousAssigneeId || previousAssigneeId !== actorId) {
      throw new ApiError(403, 'Forbidden: You can only update tasks assigned to you');
    }
    // Team members work on tasks; they do not re-plan or re-assign them
    const managedFields: (keyof ITask)[] = ['assignedTo', 'estimatedHours', 'milestone', 'startDate', 'endDate', 'department'];
    for (const field of managedFields) {
      if (field in updateData) delete (updateData as any)[field];
    }
  }

  // Derived field: only time logs change spentHours
  delete (updateData as any).spentHours;

  if (updateData.estimatedHours !== undefined && updateData.estimatedHours !== task.estimatedHours) {
    const milestoneId = toId(task.milestone)!;
    await enforceHourCap(milestoneId, updateData.estimatedHours, id);
    if (updateData.estimatedHours < (task.spentHours || 0)) {
      throw new ApiError(400, `Estimate cannot be below the ${task.spentHours}h already logged on this task`);
    }
  }

  const assignmentChanged = 'assignedTo' in updateData && toId(updateData.assignedTo) !== previousAssigneeId;
  const nextAssigneeId = assignmentChanged ? toId(updateData.assignedTo) : previousAssigneeId;

  // Status follows assignment when the caller did not pick a status explicitly
  if (assignmentChanged && updateData.status === undefined) {
    if (nextAssigneeId && (previousStatus === 'unassigned' || !previousStatus)) {
      updateData.status = 'assigned';
    } else if (!nextAssigneeId && previousStatus !== 'completed') {
      updateData.status = 'unassigned';
    }
  }
  if (updateData.status === 'assigned' && !nextAssigneeId) {
    updateData.status = 'unassigned';
  }
  if (updateData.status === 'in_progress' && !nextAssigneeId) {
    throw new ApiError(400, 'Assign the task to someone before starting work on it');
  }
  if (updateData.status === 'in_progress' && task.estimatedHours > 0 && (task.spentHours || 0) >= task.estimatedHours) {
    throw new ApiError(400, `Task estimate (${task.estimatedHours}h) is already used up. Increase the estimate or move it to review.`);
  }

  const statusChanged = updateData.status !== undefined && updateData.status !== previousStatus;
  const leavingInProgress = statusChanged && previousStatus === 'in_progress';
  const enteringInProgress = statusChanged && updateData.status === 'in_progress';

  // Moving away from in_progress ends all running timers on the task first,
  // so the logged hours are final before the status is written.
  if (leavingInProgress || (assignmentChanged && previousStatus === 'in_progress')) {
    await stopActiveTimersForTask(id, `Auto-stopped: task moved to ${updateData.status || 'reassigned'}`);
  }

  if (statusChanged && updateData.status === 'in_review') {
    (updateData as any).inReviewAt = new Date();
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!updatedTask) {
    throw new ApiError(404, 'Task not found after update');
  }

  // Assignee pressing "In Progress" starts their timer on this task
  if (enteringInProgress && user && actorId && nextAssigneeId === actorId) {
    await startTimer(user, id);
  }

  // Estimate changed: re-check cap-based transitions
  if (updateData.estimatedHours !== undefined && updateData.status === undefined) {
    const spent = updatedTask.spentHours || 0;
    if (updatedTask.estimatedHours > 0 && spent >= updatedTask.estimatedHours && updatedTask.status === 'in_progress') {
      await stopActiveTimersForTask(id, 'Auto-stopped: estimate reached');
      await Task.updateOne({ _id: id }, { status: 'in_review', inReviewAt: new Date() });
    } else if (spent < updatedTask.estimatedHours && updatedTask.status === 'in_review' && previousStatus === 'in_review') {
      // Estimate raised above logged hours: the task has room again
      await Task.updateOne({ _id: id }, { status: spent > 0 ? 'in_progress' : 'assigned' });
    }
  }

  if (assignmentChanged && nextAssigneeId) {
    await ensureAssigneeOnProjectTeam(updatedTask.milestone, nextAssigneeId);
  }

  const milestoneId = toId(updatedTask.milestone);
  if (milestoneId) {
    await evaluateAndUpdateMilestoneStatus(milestoneId);
  }

  const finalTask = await Task.findById(id)
    .populate('assignedTo', 'name email avatarUrl role')
    .populate({ path: 'attachments', populate: { path: 'uploadedBy', select: 'name' } });
  if (!finalTask) {
    throw new ApiError(404, 'Task not found after update');
  }

  if (assignmentChanged && nextAssigneeId) {
    await notifyAssignment(finalTask);
  }
  if (statusChanged && finalTask.status !== previousStatus) {
    await notifyStatusChange(finalTask, previousStatus, finalTask.status);
  }

  return finalTask;
};

export const deleteTask = async (id: string, user?: RequestUser): Promise<void> => {
  const task = await getTaskById(id, user);
  const milestoneId = toId(task.milestone);

  await TimeLog.deleteMany({ task: id });
  await task.deleteOne();

  if (milestoneId) {
    await evaluateAndUpdateMilestoneStatus(milestoneId);
  }
};
