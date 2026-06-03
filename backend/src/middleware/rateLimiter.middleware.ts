import rateLimit from 'express-rate-limit';
import { config } from '@config/app.config';
import { TooManyRequestsError } from '@lib/errors';
import { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting Middleware
//
// Uses in-memory store (default) for single-instance deployments.
// For multi-instance Render deployments, swap the store to a Redis-backed
// store (e.g., `rate-limit-redis`) using the same Upstash connection.
//
// We define multiple limiters with different windows:
//   - globalLimiter    → all routes (100 req/min)
//   - authLimiter      → login/register (10 req/15min) — brute-force protection
//   - strictLimiter    → password reset / sensitive ops (5 req/hour)
// ─────────────────────────────────────────────────────────────────────────────

const buildLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: (err: unknown) => void) => {
      next(new TooManyRequestsError(message));
    },
    skip: (req: Request) => {
      // Never rate-limit health checks — needed for Render's uptime probes
      return req.path === '/health' || req.path === '/api/v1/health';
    },
  });

export const globalLimiter = buildLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'Too many requests — please try again later',
);

export const authLimiter = buildLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many authentication attempts — please try again in 15 minutes',
);

export const strictLimiter = buildLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many attempts — please try again in 1 hour',
);
