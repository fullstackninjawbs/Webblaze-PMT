import { TimeLog, ITimeLog } from './timeLog.model';
import { Task, ITask } from '../tasks/task.model';
import { Milestone } from '../milestones/milestone.model';
import { evaluateAndUpdateMilestoneStatus } from '../milestones/milestone.service';
import { ApiError } from '../../utils/ApiError';
import { User } from '../users/user.model';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';

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

export const startTimer = async (userId: string, taskId: string, description?: string): Promise<ITimeLog> => {
  // If user already has an active timer, auto-stop it cleanly first
  const activeTimer = await TimeLog.findOne({ user: userId, endTime: { $exists: false } });
  if (activeTimer) {
    await stopTimer(userId, 'Auto-stopped on starting new timer');
  }

  // Ensure task exists
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const currentSpent = task.spentHours || 0;
  const estimated = task.estimatedHours || 0;
  if (estimated > 0 && currentSpent >= estimated) {
    throw new ApiError(
      400,
      `Cannot start timer. Task estimated limit (${estimated}h) has already been reached.`
    );
  }

  // Update task status to in_progress if it's still assigned
  if (task.status === 'assigned') {
    task.status = 'in_progress';
    await task.save();
  }

  const newLog = await TimeLog.create({
    user: userId,
    task: taskId,
    startTime: new Date(),
    description,
  });

  return newLog.populate('task', 'title milestone');
};

export const stopTimer = async (userId: string, description?: string): Promise<ITimeLog> => {
  const activeTimer = await TimeLog.findOne({ user: userId, endTime: { $exists: false } }).populate('task');

  if (!activeTimer) {
    throw new ApiError(400, 'No active timer found to stop');
  }

  activeTimer.endTime = new Date();
  const durationSeconds = Math.floor((activeTimer.endTime.getTime() - activeTimer.startTime.getTime()) / 1000);
  activeTimer.durationSeconds = durationSeconds;
  
  // Increment spentHours on the Task and Milestone
  let durationHours = Number((durationSeconds / 3600).toFixed(4));
  const taskDoc: any = activeTimer.task;

  if (taskDoc && taskDoc.estimatedHours > 0) {
    const currentSpent = taskDoc.spentHours || 0;
    const remaining = Math.max(0, taskDoc.estimatedHours - currentSpent);
    if (durationHours > remaining) {
      durationHours = remaining;
      activeTimer.durationSeconds = Math.round(remaining * 3600);
    }
  }

  await activeTimer.save();

  const updatedTask = await Task.findByIdAndUpdate(
    taskDoc._id,
    { $inc: { spentHours: durationHours } },
    { new: true }
  );

  // Auto-complete task if spentHours has reached or exceeded estimatedHours
  if (updatedTask && updatedTask.spentHours >= updatedTask.estimatedHours && updatedTask.status !== 'completed') {
    await Task.findByIdAndUpdate(taskDoc._id, { status: 'completed' });
  }

  if (taskDoc.milestone) {
    const milestoneId = typeof taskDoc.milestone === 'object' ? taskDoc.milestone._id : taskDoc.milestone;
    await Milestone.findByIdAndUpdate(milestoneId, {
      $inc: { spentHours: durationHours }
    });
    await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
  }

  return activeTimer;
};

export const getActiveTimer = async (userId: string): Promise<ITimeLog | null> => {
  return TimeLog.findOne({ user: userId, endTime: { $exists: false } })
    .populate('task', 'title milestone')
    .populate({
      path: 'task',
      populate: {
        path: 'milestone',
        select: 'title project'
      }
    });
};

export const getTimeLogsByTask = async (taskId: string): Promise<ITimeLog[]> => {
  return TimeLog.find({ task: taskId })
    .populate('user', 'name avatarUrl')
    .sort({ startTime: -1 });
};

export const getTeamTimeLogs = async (user?: any): Promise<ITimeLog[]> => {
  // Return all active timers, plus recently stopped ones (e.g. last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const query: any = {
    $or: [
      { endTime: { $exists: false } },
      { startTime: { $gte: sevenDaysAgo } }
    ]
  };
  
  if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
    if (user.department) {
      const deptVariants = normalizeDept(user.department);
      const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
      
      const deptUsers = await User.find({
        $or: [
          { department: { $in: regexes } },
          { department: user.department }
        ]
      }).select('_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      
      query.user = { $in: deptUserIds };
    } else {
      query.user = user.id || user._id;
    }
  }

  return TimeLog.find(query)
    .populate('user', 'name avatarUrl role')
    .populate({
      path: 'task',
      select: 'title milestone',
      populate: {
        path: 'milestone',
        select: 'title project',
        populate: {
          path: 'project',
          select: 'name'
        }
      }
    })
    .sort({ startTime: -1 })
    .limit(100);
};

export const createManualLog = async (userId: string, taskId: string, hours: number, description?: string): Promise<ITimeLog> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const currentSpent = task.spentHours || 0;
  const estimated = task.estimatedHours || 0;

  if (estimated > 0 && currentSpent + hours > estimated) {
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
    user: userId,
    task: taskId,
    startTime,
    endTime: now,
    durationSeconds,
    description: description || 'Manual time log',
  });

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $inc: { spentHours: hours } },
    { new: true }
  );

  if (updatedTask && updatedTask.spentHours >= updatedTask.estimatedHours && updatedTask.status !== 'completed') {
    await Task.findByIdAndUpdate(taskId, { status: 'completed' });
  }

  if (task.milestone) {
    const milestoneId = typeof task.milestone === 'object' ? (task.milestone as any)._id : task.milestone;
    await Milestone.findByIdAndUpdate(milestoneId, {
      $inc: { spentHours: hours }
    });
    await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
  }

  return newLog;
};

export const deleteTimeLog = async (logId: string): Promise<void> => {
  const log = await TimeLog.findById(logId);
  if (!log) {
    throw new ApiError(404, 'Time log not found');
  }

  const durationHours = (log.durationSeconds || 0) / 3600;
  const taskId = typeof log.task === 'object' ? (log.task as any)._id : log.task;

  await TimeLog.findByIdAndDelete(logId);

  if (taskId) {
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $inc: { spentHours: -durationHours } },
      { new: true }
    );

    if (updatedTask) {
      if (updatedTask.spentHours < 0) {
        await Task.findByIdAndUpdate(taskId, { spentHours: 0 });
        updatedTask.spentHours = 0;
      }

      if (updatedTask.spentHours < updatedTask.estimatedHours && updatedTask.status === 'completed') {
        const newStatus = updatedTask.spentHours > 0 ? 'in_progress' : 'assigned';
        await Task.findByIdAndUpdate(taskId, { status: newStatus });
      }

      if (updatedTask.milestone) {
        const milestoneId = typeof updatedTask.milestone === 'object' ? (updatedTask.milestone as any)._id : updatedTask.milestone;
        await Milestone.findByIdAndUpdate(milestoneId, {
          $inc: { spentHours: -durationHours }
        });
        const updatedMilestone = await Milestone.findById(milestoneId);
        if (updatedMilestone && updatedMilestone.spentHours < 0) {
          await Milestone.findByIdAndUpdate(milestoneId, { spentHours: 0 });
        }
        await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
      }
    }
  }
};

export const clearTaskTimeLogs = async (taskId: string): Promise<void> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const logs = await TimeLog.find({ task: taskId });
  const totalDurationSeconds = logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
  const totalDurationHours = totalDurationSeconds / 3600;

  await TimeLog.deleteMany({ task: taskId });

  await Task.findByIdAndUpdate(taskId, { spentHours: 0 });

  if (task.status === 'completed') {
    await Task.findByIdAndUpdate(taskId, { status: 'assigned' });
  }

  if (task.milestone) {
    const milestoneId = typeof task.milestone === 'object' ? (task.milestone as any)._id : task.milestone;
    await Milestone.findByIdAndUpdate(milestoneId, {
      $inc: { spentHours: -totalDurationHours }
    });
    const updatedMilestone = await Milestone.findById(milestoneId);
    if (updatedMilestone && updatedMilestone.spentHours < 0) {
      await Milestone.findByIdAndUpdate(milestoneId, { spentHours: 0 });
    }
    await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
  }
};

export const getTeamHoursSummary = async (user?: any): Promise<TeamMemberHoursSummary[]> => {
  const userQuery: any = { isActive: true };
  
  if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
    if (user.department) {
      const deptVariants = normalizeDept(user.department);
      const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
      userQuery.$or = [
        { department: { $in: regexes } },
        { department: user.department }
      ];
    } else {
      userQuery._id = user.id || user._id;
    }
  }
  
  const users = await User.find(userQuery).select('name email role department avatarUrl');
  const userIds = users.map(u => u._id);
  
  const tasks = await Task.find({ assignedTo: { $in: userIds } });
  const logs = await TimeLog.find({ user: { $in: userIds }, durationSeconds: { $gt: 0 } });

  const summaryMap = new Map<string, { assigned: number; spent: number }>();

  for (const user of users) {
    summaryMap.set(user._id.toString(), { assigned: 0, spent: 0 });
  }

  for (const task of tasks) {
    if (task.assignedTo) {
      const uId = task.assignedTo.toString();
      const current = summaryMap.get(uId) || { assigned: 0, spent: 0 };
      current.assigned += task.estimatedHours || 0;
      summaryMap.set(uId, current);
    }
  }

  for (const log of logs) {
    if (log.user) {
      const uId = log.user.toString();
      const current = summaryMap.get(uId) || { assigned: 0, spent: 0 };
      current.spent += (log.durationSeconds || 0) / 3600;
      summaryMap.set(uId, current);
    }
  }

  return users.map((u) => {
    const uId = u._id.toString();
    const data = summaryMap.get(uId) || { assigned: 0, spent: 0 };
    const assignedHours = Number(data.assigned.toFixed(2));
    const spentHours = Number(data.spent.toFixed(2));
    const pendingHours = Number(Math.max(assignedHours - spentHours, 0).toFixed(2));

    return {
      userId: uId,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      avatarUrl: u.avatarUrl,
      assignedHours,
      spentHours,
      pendingHours,
    };
  });
};
