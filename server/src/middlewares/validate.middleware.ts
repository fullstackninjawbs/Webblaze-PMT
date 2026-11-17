import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates the request and REPLACES req.body with the parsed result.
 * Zod strips keys the schema does not declare, so unknown fields and Mongo operators
 * such as `$set` never reach a service.
 */
export const validate = (schema: AnyZodObject | z.ZodEffects<AnyZodObject>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed: any = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed && parsed.body !== undefined) {
      req.body = parsed.body;
    }
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = Object.values(error.flatten().fieldErrors).flat();
      return next(new ApiError(400, 'Validation Error', 'VALIDATION_ERROR', details));
    }
    return next(error);
  }
};
