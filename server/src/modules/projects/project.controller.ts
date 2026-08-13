import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ProjectService } from './project.service';
import { Role } from '../../types';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await ProjectService.createProject(req.body, (req as any).user._id as string);
  res.status(201).json({ success: true, data: project });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await ProjectService.getProjects((req as any).user);
  res.status(200).json({ success: true, data: projects });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await ProjectService.getProjectById(req.params.id, (req as any).user);
  res.status(200).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await ProjectService.updateProject(req.params.id, req.body);
  // Send the stripped version if needed, but only ADMIN/PM can update anyway
  res.status(200).json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await ProjectService.deleteProject(req.params.id);
  res.status(200).json({ success: true, data: {} });
});
