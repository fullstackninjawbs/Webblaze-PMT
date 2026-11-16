import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as timeLogService from './timeLog.service';

const getUser = (req: Request) => (req as any).user;
const getUserId = (req: Request) => String(getUser(req)._id || getUser(req).id);

export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, description } = req.body;
  const timeLog = await timeLogService.startTimer(getUser(req), taskId, description);
  res.status(201).json({ success: true, data: timeLog, message: 'Timer started' });
});

export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  const { description } = req.body;
  const timeLog = await timeLogService.stopTimer(getUserId(req), description);
  res.status(200).json({ success: true, data: timeLog, message: 'Timer stopped' });
});

export const getActiveTimer = asyncHandler(async (req: Request, res: Response) => {
  const timeLog = await timeLogService.getActiveTimer(getUserId(req));
  res.status(200).json({ success: true, data: timeLog });
});

export const getTimeLogsByTask = asyncHandler(async (req: Request, res: Response) => {
  const timeLogs = await timeLogService.getTimeLogsByTask(req.params.taskId, getUser(req));
  res.status(200).json({ success: true, data: timeLogs });
});

export const getTeamTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const params: any = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sort: req.query.sort as string,
    status: req.query.status as string,
  };
  const result = await timeLogService.getTeamTimeLogs(getUser(req), params);
  res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

export const getTeamHoursSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await timeLogService.getTeamHoursSummary(getUser(req));
  res.status(200).json({ success: true, data: summary });
});

export const createManualLog = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, hours, description } = req.body;
  const timeLog = await timeLogService.createManualLog(getUser(req), taskId, Number(hours), description);
  res.status(201).json({ success: true, data: timeLog, message: 'Time logged successfully' });
});

export const deleteTimeLog = asyncHandler(async (req: Request, res: Response) => {
  await timeLogService.deleteTimeLog(req.params.id);
  res.status(200).json({ success: true, data: {}, message: 'Time log deleted successfully' });
});

export const clearTaskTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  await timeLogService.clearTaskTimeLogs(req.params.taskId);
  res.status(200).json({ success: true, data: {}, message: 'All time logs for task cleared successfully' });
});

export const getMyEodSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await timeLogService.getMyEodSummary(getUserId(req));
  res.status(200).json({ success: true, data: summary });
});
