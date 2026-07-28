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
  const { projectId } = req.query;
  let milestones: any[] = [];
  if (projectId) {
    milestones = await milestoneService.getMilestonesByProject(projectId as string);
  } else {
    // If no project ID is provided, return empty array for now
    // Alternatively, we could fetch all milestones, but usually they are scoped
    milestones = [];
  }
  
  res.status(200).json({
    success: true,
    data: milestones,
  });
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
