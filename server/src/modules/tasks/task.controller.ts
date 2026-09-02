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
  const { milestoneId, userId, page, limit, sort, status, search, department } = req.query;
  const params: any = { page, limit, sort, status, search, department };
  let result: any;
  
  if (milestoneId) {
    result = await taskService.getTasksByMilestone(milestoneId as string, user, params);
  } else if (userId) {
    result = await taskService.getTasksByUser(userId as string, params);
  } else {
    result = await taskService.getAllTasks(user, params);
  }
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
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
