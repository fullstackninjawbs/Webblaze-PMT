import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as taskService from './task.service';
import { Role } from '../../types';
import { ApiError } from '../../utils/ApiError';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  // inject createdBy from auth user
  const taskData = { ...req.body, createdBy: (req as any).user.id };
  const task = await taskService.createTask(taskData);
  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully',
  });
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { milestoneId, userId } = req.query;
  let tasks: any[] = [];
  
  if (milestoneId) {
    tasks = await taskService.getTasksByMilestone(milestoneId as string, user);
  } else if (userId) {
    tasks = await taskService.getTasksByUser(userId as string);
  } else {
    tasks = await taskService.getAllTasks(user);
  }
  
  res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id, (req as any).user);
  res.status(200).json({
    success: true,
    data: task,
  });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (req.body.status === 'completed' && user.role !== Role.ADMIN && user.role !== Role.PM) {
    throw new ApiError(403, 'Only PM or Admin can mark a task as completed');
  }

  const task = await taskService.updateTask(req.params.id, req.body, user as any);
  res.status(200).json({
    success: true,
    data: task,
    message: 'Task updated successfully',
  });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: 'Task deleted successfully',
  });
});
