import { Task, ITask } from './task.model';
import { Milestone } from '../milestones/milestone.model';
import { ApiError } from '../../utils/ApiError';

const enforceHourCap = async (milestoneId: string, estimatedHours: number, currentTaskId?: string) => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  const query: any = { milestone: milestoneId };
  if (currentTaskId) {
    query._id = { $ne: currentTaskId };
  }

  const siblingTasks = await Task.find(query);
  const sumOfSiblingHours = siblingTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  if (sumOfSiblingHours + estimatedHours > milestone.estimatedHours) {
    throw new ApiError(
      400,
      `Task exceeds milestone estimated hours. Milestone budget: ${milestone.estimatedHours}, Used: ${sumOfSiblingHours}, Task: ${estimatedHours}`
    );
  }
};

export const createTask = async (data: Partial<ITask>): Promise<ITask> => {
  await enforceHourCap(data.milestone as unknown as string, data.estimatedHours!);
  
  const task = await Task.create(data);
  return task;
};

export const getTasksByMilestone = async (milestoneId: string): Promise<ITask[]> => {
  return Task.find({ milestone: milestoneId })
    .populate('assignedTo', 'name email avatarUrl role')
    .sort({ createdAt: -1 });
};

export const getTasksByUser = async (userId: string): Promise<ITask[]> => {
  return Task.find({ assignedTo: userId })
    .populate({
      path: 'milestone',
      populate: {
        path: 'project',
        select: 'name client',
      },
    })
    .sort({ createdAt: -1 });
};

export const getTaskById = async (id: string): Promise<ITask> => {
  const task = await Task.findById(id).populate('assignedTo', 'name email avatarUrl role');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
};

export const updateTask = async (id: string, updateData: Partial<ITask>): Promise<ITask> => {
  const task = await getTaskById(id);
  
  if (updateData.estimatedHours !== undefined && updateData.estimatedHours !== task.estimatedHours) {
    await enforceHourCap(task.milestone as unknown as string, updateData.estimatedHours, id);
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email avatarUrl role');

  return updatedTask!;
};

export const deleteTask = async (id: string): Promise<void> => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
};
