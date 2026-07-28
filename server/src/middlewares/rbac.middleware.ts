import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/users/user.model';
import { Role } from '../types';

export const rbacMiddleware = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new ApiError(401, 'User not authenticated');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ApiError(403, 'Forbidden: insufficient permissions', 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
