import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import { User } from '../users/user.model';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.loginUser(email, password);
  
  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: { user, accessToken: tokens.accessToken },
    message: 'Login successful'
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user } = await authService.registerUser(req.body);
  res.status(201).json({
    success: true,
    data: { user },
    message: 'User registered successfully. Invitation email sent.',
  });
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { inviteToken } = req.body;
  if (!inviteToken) {
    res.status(400).json({ success: false, error: { message: 'Invitation token is required' } });
    return;
  }

  const { user, tokens } = await authService.acceptInviteToken(inviteToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: { user, accessToken: tokens.accessToken },
    message: 'Invitation accepted successfully',
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    res.status(401).json({ success: false, error: { message: 'No refresh token provided' } });
    return;
  }

  const tokens = await authService.refreshTokens(refreshToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: { accessToken: tokens.accessToken },
    message: 'Tokens refreshed'
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    success: true,
    data: null,
    message: 'Logged out successfully'
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  res.status(200).json({
    success: true,
    data: { user },
    message: 'User fetched'
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id || (req as any).user._id;

  await authService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Password changed successfully'
  });
});
