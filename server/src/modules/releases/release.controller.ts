import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as releaseService from './release.service';

export const createRelease = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id || (req as any).user.id;
  const releaseData = { ...req.body, createdBy: userId };
  
  const release = await releaseService.createRelease(releaseData);
  
  res.status(201).json({
    success: true,
    data: release,
    message: 'Release created successfully',
  });
});

export const getReleases = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  // Allow filtering via query parameters
  const filters: any = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.project) filters.project = req.query.project;
  
  const releases = await releaseService.getAllReleases(user.role, user._id || user.id, filters);
  
  res.status(200).json({
    success: true,
    data: releases,
  });
});

export const getReleaseById = asyncHandler(async (req: Request, res: Response) => {
  const release = await releaseService.getReleaseById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: release,
  });
});

export const updateRelease = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const release = await releaseService.updateRelease(req.params.id, req.body, user.role, user._id || user.id);
  
  res.status(200).json({
    success: true,
    data: release,
    message: 'Release updated successfully',
  });
});

export const deleteRelease = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await releaseService.deleteRelease(req.params.id, user.role, user._id || user.id);
  
  res.status(200).json({
    success: true,
    data: null,
    message: 'Release deleted successfully',
  });
});
