import { TimeLog, ITimeLog } from './timeLog.model';
import { Task } from '../tasks/task.model';
import { Milestone } from '../milestones/milestone.model';
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
  
  await Task.findByIdAndUpdate(taskDoc._id, {
    $inc: { spentHours: durationHours }
  });

  if (taskDoc.milestone) {
    await Milestone.findByIdAndUpdate(taskDoc.milestone, {
      $inc: { spentHours: durationHours }
    });
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
