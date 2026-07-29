import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as dailyStatusService from './dailyStatus.service';

export const createDailyStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const statusData = {
    ...req.body,
    user: user._id || user.id,
    project: req.body.project || undefined
  };

  const status = await dailyStatusService.createDailyStatus(statusData);

  res.status(201).json({
    success: true,
    data: status,
    message: 'Daily status submitted successfully',
  });
});

export const getMyDailyStatuses = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const statuses = await dailyStatusService.getMyDailyStatuses(user._id || user.id);

  res.status(200).json({
    success: true,
    data: statuses,
  });
});

export const getTeamDailyStatuses = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const statuses = await dailyStatusService.getTeamDailyStatuses(user.role, user._id || user.id);

  res.status(200).json({
    success: true,
    data: statuses,
  });
});
