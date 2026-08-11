import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as timeLogService from './timeLog.service';

export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, description } = req.body;
  const userId = (req as any).user._id || (req as any).user.id;
  
  const timeLog = await timeLogService.startTimer(userId, taskId, description);
  
  res.status(201).json({
    success: true,
    data: timeLog,
    message: 'Timer started',
  });
});

export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  const { description } = req.body;
  const userId = (req as any).user._id || (req as any).user.id;
  
  const timeLog = await timeLogService.stopTimer(userId, description);
  
  res.status(200).json({
    success: true,
    data: timeLog,
    message: 'Timer stopped',
  });
});

export const getActiveTimer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id || (req as any).user.id;
  const timeLog = await timeLogService.getActiveTimer(userId);
  
  res.status(200).json({
    success: true,
    data: timeLog,
  });
});

export const getTimeLogsByTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const timeLogs = await timeLogService.getTimeLogsByTask(taskId);
  
  res.status(200).json({
    success: true,
    data: timeLogs,
  });
});

export const getTeamTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const timeLogs = await timeLogService.getTeamTimeLogs();
  
  res.status(200).json({
    success: true,
    data: timeLogs,
  });
});

export const getTeamHoursSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await timeLogService.getTeamHoursSummary();
  res.status(200).json({
    success: true,
    data: summary,
  });
});

export const createManualLog = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, hours, description } = req.body;
  const userId = (req as any).user._id || (req as any).user.id;
  
  const timeLog = await timeLogService.createManualLog(userId, taskId, Number(hours), description);
  
  res.status(201).json({
    success: true,
    data: timeLog,
    message: 'Time logged successfully',
  });
});

export const deleteTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await timeLogService.deleteTimeLog(id);
  res.status(200).json({
    success: true,
    data: {},
    message: 'Time log deleted successfully',
  });
});

export const clearTaskTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  await timeLogService.clearTaskTimeLogs(taskId);
  res.status(200).json({
    success: true,
    data: {},
    message: 'All time logs for task cleared successfully',
  });
});
