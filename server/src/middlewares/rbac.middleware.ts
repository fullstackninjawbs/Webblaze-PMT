import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/users/user.model';
import { Role } from '../types';

export const rbacMiddleware = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ApiError(403, 'Forbidden: insufficient permissions', 'FORBIDDEN');
      }

      // Attach full user object for subsequent middlewares/controllers if needed
      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
