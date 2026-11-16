import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { UserService } from './user.service';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.getUsers((req as any).user, req.query);
  res.status(200).json({ success: true, ...result });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
  const user = await UserService.updateUser(req.params.id, req.body, currentUserId);
  res.status(200).json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
  await UserService.deleteUser(req.params.id, currentUserId);
  res.status(200).json({ success: true, data: {} });
});
