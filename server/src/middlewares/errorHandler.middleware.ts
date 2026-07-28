import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'INTERNAL_ERROR';
  let details = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || 'API_ERROR';
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Mongoose Validation Error
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  } else if (err.code === 11000) {
    // Mongoose Duplicate Key Error
    statusCode = 400;
    message = 'Duplicate field value entered';
    errorCode = 'DUPLICATE_KEY';
  }

  // Log error
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
