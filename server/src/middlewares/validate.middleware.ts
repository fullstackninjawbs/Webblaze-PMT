import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: AnyZodObject | z.ZodEffects<AnyZodObject>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = Object.values(error.flatten().fieldErrors).flat();
      return next(new ApiError(400, 'Validation Error', 'VALIDATION_ERROR', details));
    }
    return next(error);
  }
};
