import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = env.NODE_ENV === 'production';

  // Never leak internal stack traces or database connection details in production
  const response = {
    error: err.name || 'InternalServerError',
    message: isProduction && statusCode === 500 ? 'An unexpected internal server error occurred' : err.message,
    status: statusCode,
    ...(isProduction ? {} : { stack: err.stack }),
  };

  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${err.name}: ${err.message}`);
  }

  res.status(statusCode).json(response);
}
