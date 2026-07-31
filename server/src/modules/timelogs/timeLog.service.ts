import { TimeLog, ITimeLog } from './timeLog.model';
import { Task } from '../tasks/task.model';
import { Milestone } from '../milestones/milestone.model';
import { evaluateAndUpdateMilestoneStatus } from '../milestones/milestone.service';
import { ApiError } from '../../utils/ApiError';

export const startTimer = async (userId: string, taskId: string, description?: string): Promise<ITimeLog> => {
  // Check if user already has an active timer
  const activeTimer = await TimeLog.findOne({ user: userId, endTime: { $exists: false } });
  
  if (activeTimer) {
    throw new ApiError(400, 'You already have an active timer. Please stop it first.');
  }

  // Ensure task exists
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
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
  
  if (description) {
    activeTimer.description = description;
  }

  await activeTimer.save();

  // Increment spentHours on the Task and Milestone
  const durationHours = durationSeconds / 3600;
  const taskDoc: any = activeTimer.task;

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

export const getTeamTimeLogs = async (): Promise<ITimeLog[]> => {
  // Return all active timers, plus recently stopped ones (e.g. last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return TimeLog.find({
    $or: [
      { endTime: { $exists: false } },
      { startTime: { $gte: sevenDaysAgo } }
    ]
  })
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
