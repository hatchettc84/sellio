import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} was not found`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const statusCode = typeof err === 'object' && err !== null && 'status' in err
    ? Number((err as { status?: number }).status) || 500
    : 500;

  const message = typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message?: string }).message)
    : 'Unexpected error';

  logger.error({ err, path: req.originalUrl }, message);

  res.status(statusCode).json({
    error: 'INTERNAL_ERROR',
    message,
  });
}
