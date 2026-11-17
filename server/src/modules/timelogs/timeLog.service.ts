import { TimeLog, ITimeLog } from './timeLog.model';
import { dayBounds, isSameBusinessDay } from '../../utils/appTime';
import { Task } from '../tasks/task.model';
import { evaluateAndUpdateMilestoneStatus } from '../milestones/milestone.service';
import { ApiError } from '../../utils/ApiError';
import { User } from '../users/user.model';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { canAccessMilestone, getUserId, isProjectScopedRole, RequestUser } from '../../utils/access';

export interface TeamMemberHoursSummary {
  userId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  assignedHours: number;
  spentHours: number;
  pendingHours: number;
}

const roundHours = (hours: number) => Number(hours.toFixed(4));
const toMinutes = (hours: number) => Math.round((hours || 0) * 60);

const getMilestoneId = (task: any): string | null => {
  if (!task?.milestone) return null;
  return typeof task.milestone === 'object' ? String(task.milestone._id) : String(task.milestone);
};

const getAssigneeId = (task: any): string | null => {
  if (!task?.assignedTo) return null;
  return typeof task.assignedTo === 'object' ? String(task.assignedTo._id) : String(task.assignedTo);
};

/**
 * Who may log time against a task:
 *  - Admin / PM: any task
 *  - Team Lead / Team Member: only tasks assigned to them (or unassigned tasks in their projects)
 */
const assertCanLogTime = async (user: RequestUser, task: any) => {
  if (!isProjectScopedRole(user.role)) return;

  const userId = getUserId(user);
  const assigneeId = getAssigneeId(task);

  if (assigneeId && assigneeId !== userId) {
    throw new ApiError(403, 'You can only log time on tasks assigned to you');
  }

  const milestoneId = getMilestoneId(task);
  if (milestoneId && !(await canAccessMilestone(user, milestoneId))) {
    throw new ApiError(403, 'You do not have access to this task');
  }
};

/**
 * Recompute Task.spentHours from its time logs. The task value is a cache of the
 * logs, so every log write goes through here instead of doing ad-hoc $inc math.
 * Returns the refreshed task, after applying the automatic status transitions:
 *  - estimate reached while in progress -> in_review
 *  - completed tasks are never reopened by a recalculation
 */
export const syncTaskHours = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const logs = await TimeLog.find({ task: taskId, endTime: { $exists: true } }).select('durationSeconds');
  const totalSeconds = logs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  const spentHours = roundHours(totalSeconds / 3600);

  let status = task.status;
  const estimateReached = task.estimatedHours > 0 && spentHours >= task.estimatedHours;

  // Reaching the estimate while working moves the task to review.
  // Completed is a PM decision: recalculating hours (deleting a log, the resync script)
  // must never reopen a completed task, even if its hours end up under the estimate.
  if (estimateReached && status === 'in_progress') {
    status = 'in_review';
  }

  const movedToReview = status === 'in_review' && task.status !== 'in_review';
  if (task.spentHours !== spentHours || task.status !== status) {
    if (movedToReview) task.inReviewAt = new Date();
    task.spentHours = spentHours;
    task.status = status;
    await task.save();
  }

  // The task left in_progress, so nobody can keep a timer running on it
  if (movedToReview) {
    await stopActiveTimersForTask(String(task._id), 'Auto-stopped: estimate reached');
  }

  const milestoneId = getMilestoneId(task);
  if (milestoneId) {
    await evaluateAndUpdateMilestoneStatus(milestoneId);
  }

  return task;
};

export const getActiveTimer = async (userId: string): Promise<ITimeLog | null> => {
  return TimeLog.findOne({ user: userId, endTime: { $exists: false } })
    .populate({
      path: 'task',
      select: 'title milestone estimatedHours spentHours status',
      populate: {
        path: 'milestone',
        select: 'title project',
        populate: { path: 'project', select: 'name' },
      },
    });
};

/**
 * Stop a specific running log. Duration is clamped so a task can never exceed its
 * estimate through the timer; the overflow is simply not counted.
 */
const closeLog = async (log: ITimeLog, description?: string): Promise<ITimeLog> => {
  const task = await Task.findById(log.task);
  const endTime = new Date();
  let durationSeconds = Math.max(0, Math.floor((endTime.getTime() - log.startTime.getTime()) / 1000));

  if (task && task.estimatedHours > 0) {
    const remainingSeconds = Math.max(0, Math.round((task.estimatedHours - (task.spentHours || 0)) * 3600));
    if (durationSeconds > remainingSeconds) durationSeconds = remainingSeconds;
  }

  // Close only if still open: two simultaneous stops must not both count the time
  const update: any = { $set: { endTime, durationSeconds }, $unset: { isRunning: 1 } };
  if (description && !log.description) update.$set.description = description;
  const closed = await TimeLog.findOneAndUpdate(
    { _id: log._id, endTime: { $exists: false } },
    update,
    { new: true }
  );
  if (!closed) {
    // Someone else closed it first; return the current state without double counting
    return (await TimeLog.findById(log._id)) || log;
  }

  if (task) await syncTaskHours(String(task._id));
  return closed;
};

export const stopTimer = async (userId: string, description?: string): Promise<ITimeLog> => {
  const activeTimer = await TimeLog.findOne({ user: userId, endTime: { $exists: false } });
  if (!activeTimer) {
    throw new ApiError(400, 'No active timer found to stop');
  }
  const closed = await closeLog(activeTimer, description);
  return closed.populate('task', 'title milestone status spentHours estimatedHours');
};

/** Stop every running timer on a task, regardless of who owns it. */
export const stopActiveTimersForTask = async (taskId: string, description?: string): Promise<number> => {
  const running = await TimeLog.find({ task: taskId, endTime: { $exists: false } });
  for (const log of running) {
    await closeLog(log, description);
  }
  return running.length;
};

export const startTimer = async (user: RequestUser, taskId: string, description?: string): Promise<ITimeLog> => {
  const userId = getUserId(user);

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  await assertCanLogTime(user, task);

  if (task.status === 'completed') {
    throw new ApiError(400, 'Cannot start a timer on a completed task');
  }
  // In progress always has an owner; an unassigned task must be assigned first
  if (!task.assignedTo) {
    throw new ApiError(400, 'Assign this task to someone before starting a timer');
  }

  const currentSpent = task.spentHours || 0;
  const estimated = task.estimatedHours || 0;
  if (estimated > 0 && currentSpent >= estimated) {
    throw new ApiError(400, `Cannot start timer. Task estimated limit (${estimated}h) has already been reached.`);
  }

  // One running timer per user: close the previous one first
  const activeTimer = await TimeLog.findOne({ user: userId, endTime: { $exists: false } });
  if (activeTimer) {
    if (String(activeTimer.task) === String(task._id)) {
      return activeTimer.populate('task', 'title milestone');
    }
    await closeLog(activeTimer, 'Auto-stopped on starting new timer');
  }

  // Working on a task means it is in progress
  if (task.status !== 'in_progress') {
    task.status = 'in_progress';
    await task.save();
    const milestoneId = getMilestoneId(task);
    if (milestoneId) await evaluateAndUpdateMilestoneStatus(milestoneId);
  }

  try {
    const newLog = await TimeLog.create({
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      description,
    });
    return newLog.populate('task', 'title milestone');
  } catch (error: any) {
    // A second, simultaneous start lost the race: return the timer that won
    if (error?.code === 11000) {
      const running = await TimeLog.findOne({ user: userId, endTime: { $exists: false } });
      if (running) return running.populate('task', 'title milestone');
    }
    throw error;
  }
};

export const getTimeLogsByTask = async (taskId: string, user?: RequestUser): Promise<ITimeLog[]> => {
  if (user && isProjectScopedRole(user.role)) {
    const task = await Task.findById(taskId).select('milestone');
    if (!task) throw new ApiError(404, 'Task not found');
    const milestoneId = getMilestoneId(task);
    if (milestoneId && !(await canAccessMilestone(user, milestoneId))) {
      throw new ApiError(403, 'You do not have access to this task');
    }
  }

  return TimeLog.find({ task: taskId })
    .populate('user', 'name avatarUrl')
    .sort({ startTime: -1 });
};

const getDepartmentUserIds = async (user: RequestUser) => {
  if (!user.department) return [getUserId(user)];
  const deptVariants = normalizeDept(user.department);
  const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
  const deptUsers = await User.find({
    $or: [{ department: { $in: regexes } }, { department: user.department }],
  }).select('_id');
  return deptUsers.map((u) => u._id);
};

export const getTeamTimeLogs = async (user?: RequestUser, params: PaginationParams = {}): Promise<PaginatedResult<ITimeLog>> => {
  // Return all active timers, plus recently stopped ones (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const query: any = {};

  if (params.status === 'running') {
    query.endTime = { $exists: false };
  } else if (params.status === 'completed') {
    query.endTime = { $exists: true };
    query.startTime = { $gte: sevenDaysAgo };
  } else {
    query.$or = [{ endTime: { $exists: false } }, { startTime: { $gte: sevenDaysAgo } }];
  }

  if (user?.role === Role.TEAM_MEMBER) {
    query.user = getUserId(user);
  } else if (user?.role === Role.TEAM_LEAD) {
    query.user = { $in: await getDepartmentUserIds(user) };
  }

  const populateOptions = [
    { path: 'user', select: 'name avatarUrl role' },
    {
      path: 'task',
      select: 'title milestone',
      populate: {
        path: 'milestone',
        select: 'title project',
        populate: { path: 'project', select: 'name' },
      },
    },
  ];

  return paginate(TimeLog, query, { ...params, sort: params.sort || '-startTime' }, populateOptions);
};

export const createManualLog = async (
  user: RequestUser,
  taskId: string,
  hours: number,
  description?: string
): Promise<ITimeLog> => {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new ApiError(400, 'Hours must be a positive number');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  await assertCanLogTime(user, task);

  if (task.status === 'completed') {
    throw new ApiError(400, 'Cannot log time on a completed task');
  }

  const currentSpent = task.spentHours || 0;
  const estimated = task.estimatedHours || 0;

  // Compare in whole minutes: 1.1 + 2.2 in floating point is 3.3000000000000003 > 3.3
  if (estimated > 0 && toMinutes(currentSpent) + toMinutes(hours) > toMinutes(estimated)) {
    const remaining = Math.max(0, estimated - currentSpent);
    throw new ApiError(
      400,
      `Cannot log ${hours}h. Logged time cannot exceed task estimated hours (${estimated}h). Remaining allowed: ${Number(remaining.toFixed(2))}h.`
    );
  }

  const durationSeconds = Math.round(hours * 3600);
  const now = new Date();
  const startTime = new Date(now.getTime() - durationSeconds * 1000);

  const newLog = await TimeLog.create({
    user: getUserId(user),
    task: taskId,
    startTime,
    endTime: now,
    durationSeconds,
    description: description || 'Manual time log',
  });

  await syncTaskHours(taskId);
  return newLog;
};

export const deleteTimeLog = async (logId: string): Promise<void> => {
  const log = await TimeLog.findById(logId);
  if (!log) {
    throw new ApiError(404, 'Time log not found');
  }
  const taskId = String(log.task);
  await TimeLog.findByIdAndDelete(logId);
  await syncTaskHours(taskId);
};

export const clearTaskTimeLogs = async (taskId: string): Promise<void> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  await TimeLog.deleteMany({ task: taskId });
  await syncTaskHours(taskId);
};

export const getTeamHoursSummary = async (user?: RequestUser): Promise<TeamMemberHoursSummary[]> => {
  const userQuery: any = { isActive: true };

  if (user?.role === Role.TEAM_MEMBER) {
    userQuery._id = getUserId(user);
  } else if (user?.role === Role.TEAM_LEAD) {
    userQuery._id = { $in: await getDepartmentUserIds(user) };
  }

  const users = await User.find(userQuery).select('name email role department avatarUrl');
  const userIds = users.map((u) => u._id);

  const tasks = await Task.find({ assignedTo: { $in: userIds } }).select('assignedTo estimatedHours');
  const logs = await TimeLog.find({ user: { $in: userIds }, durationSeconds: { $gt: 0 } }).select('user durationSeconds');

  const summaryMap = new Map<string, { assigned: number; spent: number }>();
  for (const u of users) summaryMap.set(String(u._id), { assigned: 0, spent: 0 });

  for (const task of tasks) {
    if (!task.assignedTo) continue;
    const entry = summaryMap.get(String(task.assignedTo));
    if (entry) entry.assigned += task.estimatedHours || 0;
  }

  for (const log of logs) {
    const entry = summaryMap.get(String(log.user));
    if (entry) entry.spent += (log.durationSeconds || 0) / 3600;
  }

  return users.map((u) => {
    const data = summaryMap.get(String(u._id)) || { assigned: 0, spent: 0 };
    const assignedHours = Number(data.assigned.toFixed(2));
    const spentHours = Number(data.spent.toFixed(2));
    return {
      userId: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      avatarUrl: u.avatarUrl,
      assignedHours,
      spentHours,
      pendingHours: Number(Math.max(assignedHours - spentHours, 0).toFixed(2)),
    };
  });
};

/**
 * Tasks the user worked on today, grouped by project, with the hours logged TODAY on
 * each task. Running timers count up to now so the EOD form is accurate mid-session.
 */
const isSameDay = (a?: Date | null) => isSameBusinessDay(a);

/** Shape of one task line in the EOD summary. */
const toEodTask = (taskDoc: any) => {
  const movedToReviewToday = taskDoc.status === 'in_review' && isSameDay(taskDoc.inReviewAt);
  return {
    id: String(taskDoc._id),
    title: taskDoc.title,
    status: taskDoc.status,
    milestoneTitle: taskDoc.milestone?.title,
    estimatedHours: taskDoc.estimatedHours || 0,
    spentHours: taskDoc.spentHours || 0,
    hoursToday: 0,
    isRunning: false,
    movedToReviewToday,
    // The comment written when moving to review today becomes the EOD line text
    reviewNote: movedToReviewToday && taskDoc.workSummary ? String(taskDoc.workSummary).trim() : undefined,
  };
};

export const getMyEodSummary = async (userId: string) => {
  // "Today" is the business day in APP_TIMEZONE, not the server's clock
  const { start: startOfDay, end: endOfDay } = dayBounds();

  const logs = await TimeLog.find({
    user: userId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
  }).populate({
    path: 'task',
    select: 'title status milestone estimatedHours spentHours workSummary inReviewAt',
    populate: {
      path: 'milestone',
      select: 'title project',
      populate: { path: 'project', select: 'name' },
    },
  });

  const now = Date.now();
  const projectsMap = new Map<string, { id: string; name: string; timeSpent: number; tasks: any[] }>();
  let totalSeconds = 0;

  for (const log of logs) {
    const taskDoc: any = log.task;
    if (!taskDoc?.milestone?.project) continue;

    const isRunning = !log.endTime;
    const seconds = isRunning
      ? Math.max(0, Math.floor((now - log.startTime.getTime()) / 1000))
      : log.durationSeconds || 0;
    if (seconds <= 0 && !isRunning) continue;

    const projectId = String(taskDoc.milestone.project._id);
    if (!projectsMap.has(projectId)) {
      projectsMap.set(projectId, { id: projectId, name: taskDoc.milestone.project.name, timeSpent: 0, tasks: [] });
    }
    const projectData = projectsMap.get(projectId)!;
    projectData.timeSpent += seconds / 3600;
    totalSeconds += seconds;

    let taskEntry = projectData.tasks.find((t) => t.id === String(taskDoc._id));
    if (!taskEntry) {
      taskEntry = toEodTask(taskDoc);
      projectData.tasks.push(taskEntry);
    }
    taskEntry.hoursToday += seconds / 3600;
    if (isRunning) taskEntry.isRunning = true;
  }

  // Tasks this user moved to review today belong in the report even with no time logged today
  const reviewedToday = await Task.find({
    assignedTo: userId,
    inReviewAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .select('title status milestone estimatedHours spentHours workSummary inReviewAt')
    .populate({ path: 'milestone', select: 'title project', populate: { path: 'project', select: 'name' } });

  for (const taskDoc of reviewedToday as any[]) {
    if (!taskDoc?.milestone?.project) continue;
    const projectId = String(taskDoc.milestone.project._id);
    if (!projectsMap.has(projectId)) {
      projectsMap.set(projectId, { id: projectId, name: taskDoc.milestone.project.name, timeSpent: 0, tasks: [] });
    }
    const projectData = projectsMap.get(projectId)!;
    if (!projectData.tasks.find((t) => t.id === String(taskDoc._id))) {
      projectData.tasks.push(toEodTask(taskDoc));
    }
  }

  const projects = Array.from(projectsMap.values()).map((p) => ({
    ...p,
    timeSpent: roundHours(p.timeSpent),
    tasks: p.tasks.map((t) => ({ ...t, hoursToday: roundHours(t.hoursToday) })),
  }));

  return { projects, totalHours: roundHours(totalSeconds / 3600) };
};
