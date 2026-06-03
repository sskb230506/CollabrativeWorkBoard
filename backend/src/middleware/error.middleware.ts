import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@lib/errors';
import { logger } from '@lib/logger';
import { isDev } from '@config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Global Error Handler
//
// Must be registered LAST in the Express middleware chain (4 arguments).
// Catches all errors forwarded via next(err) and formats them into a
// consistent JSON error envelope.
//
// Error classification:
//   1. AppError (operational) → structured 4xx/5xx JSON
//   2. ZodError (schema)      → 422 with field-level details
//   3. Prisma errors          → mapped to appropriate HTTP codes
//   4. Unknown errors         → generic 500 (stack hidden in production)
// ─────────────────────────────────────────────────────────────────────────────

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // ── 1. Operational AppError ──────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(
        { err, method: req.method, path: req.path, userId: req.user?.id },
        'Non-operational AppError',
      );
    }

    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError && err.errors) {
      body['errors'] = err.errors;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ── 2. Zod validation error (direct throw, not wrapped in ValidationError) ─
  if (err instanceof ZodError) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  // ── 3. Prisma known errors ───────────────────────────────────────────────
  if (isPrismaError(err)) {
    const mapped = mapPrismaError(err);
    res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      code: mapped.code,
    });
    return;
  }

  // ── 4. Unknown / programmer error ────────────────────────────────────────
  logger.error(
    { err, method: req.method, path: req.path, userId: req.user?.id },
    'Unhandled error',
  );

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err instanceof Error ? err.stack : String(err) }),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler — register BEFORE errorHandler but AFTER all routes
// ─────────────────────────────────────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Prisma error helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PrismaError {
  code: string;
  meta?: Record<string, unknown>;
}

const isPrismaError = (err: unknown): err is PrismaError => {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as PrismaError).code === 'string' && (err as PrismaError).code.startsWith('P');
};

const mapPrismaError = (err: PrismaError): { status: number; message: string; code: string } => {
  switch (err.code) {
    case 'P2002':
      return {
        status: StatusCodes.CONFLICT,
        message: `A record with this ${String(err.meta?.['target'])} already exists`,
        code: 'CONFLICT',
      };
    case 'P2025':
      return {
        status: StatusCodes.NOT_FOUND,
        message: 'Record not found',
        code: 'NOT_FOUND',
      };
    case 'P2003':
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Foreign key constraint violation',
        code: 'BAD_REQUEST',
      };
    default:
      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        code: 'DATABASE_ERROR',
      };
  }
};
