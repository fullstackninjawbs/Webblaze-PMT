import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as milestoneService from './milestone.service';

export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await milestoneService.createMilestone(req.body);
  res.status(201).json({
    success: true,
    data: milestone,
    message: 'Milestone created successfully',
  });
});

export const getMilestones = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, page, limit, sort, status, search } = req.query;
  const params: any = { page, limit, sort, status, search };
  
  if (projectId) {
    const result = await milestoneService.getMilestonesByProject(projectId as string, params);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } else {
    res.status(200).json({
      success: true,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
  }
});

export const getMilestoneById = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await milestoneService.getMilestoneById(req.params.id);
  res.status(200).json({
    success: true,
    data: milestone,
  });
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await milestoneService.updateMilestone(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: milestone,
    message: 'Milestone updated successfully',
  });
});

export const deleteMilestone = asyncHandler(async (req: Request, res: Response) => {
  await milestoneService.deleteMilestone(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: 'Milestone deleted successfully',
  });
});
