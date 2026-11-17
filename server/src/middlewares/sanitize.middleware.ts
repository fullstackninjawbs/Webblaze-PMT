import { Request, Response, NextFunction } from 'express';

/**
 * Removes MongoDB operator keys ($set, $ne, $where, ...) from request bodies and query
 * strings, at any depth. Routes without a validation schema (and query strings like
 * `?status[$ne]=x`) would otherwise pass operators straight into database calls.
 */
const stripOperators = (value: any, depth = 0): any => {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = stripOperators(value[i], depth + 1);
    return value;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) {
      delete value[key];
    } else {
      value[key] = stripOperators(value[key], depth + 1);
    }
  }
  return value;
};

export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') stripOperators(req.body);
  // Express 4 exposes req.query as a plain object, so it can be cleaned in place
  if (req.query && typeof req.query === 'object') stripOperators(req.query);
  next();
};
