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
  const params: any = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sort: req.query.sort as string,
    status: req.query.status as string,
  };
  
  const result = await timeLogService.getTeamTimeLogs((req as any).user, params);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getTeamHoursSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await timeLogService.getTeamHoursSummary((req as any).user);
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

export const getMyEodSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id || (req as any).user.id;
  const summary = await timeLogService.getMyEodSummary(userId);
  
  res.status(200).json({
    success: true,
    data: summary,
  });
});
