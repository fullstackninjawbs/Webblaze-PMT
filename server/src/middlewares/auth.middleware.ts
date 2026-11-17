import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/users/user.model';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { id: string; tokenVersion?: number; typ?: string };

    // Only access tokens are accepted. Tokens issued before the typ claim existed have none.
    if (decoded.typ !== undefined && decoded.typ !== 'access') {
      throw new ApiError(401, 'Invalid token type');
    }
    // A token without a version (for example an old invite link) can never be revoked
    if (typeof decoded.tokenVersion !== 'number') {
      throw new ApiError(401, 'Invalid token');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or disabled');
    }

    if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
      throw new ApiError(401, 'User role or session updated. Please log in again.');
    }

    // Attach full user object to request
    (req as any).user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Not authorized, token failed'));
  }
};
