import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema, ZodError } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// API Response Helpers
//
// Enforces a consistent response envelope across all endpoints:
// { success, data?, message?, meta? }
//
// Tradeoff: Some REST purists prefer no envelope, but for a team product
// with a frontend client, consistent shapes reduce error-handling boilerplate
// on the client side.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = StatusCodes.OK,
  message?: string,
  meta?: PaginationMeta,
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta }),
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully',
): Response<ApiSuccessResponse<T>> => {
  return sendSuccess(res, data, StatusCodes.CREATED, message);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(StatusCodes.NO_CONTENT).send();
};

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation helper
// ─────────────────────────────────────────────────────────────────────────────

export const validateBody = <T>(schema: ZodSchema<T>, body: unknown): T => {
  return schema.parse(body);
};

export const formatZodError = (err: ZodError): string => {
  return err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
};

// ─────────────────────────────────────────────────────────────────────────────
// Async handler wrapper
// Eliminates try/catch boilerplate in controllers by forwarding errors to
// Express's next() — which routes them to the global error handler.
// ─────────────────────────────────────────────────────────────────────────────

type AsyncHandler = (
  req: Request,
  res: Response,
) => Promise<Response | void>;

export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: (err?: unknown) => void): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination helper
// ─────────────────────────────────────────────────────────────────────────────

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
