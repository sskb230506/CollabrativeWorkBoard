import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { redis } from '@lib/redis';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Health Router
//
// Provides two endpoints:
//   GET /health         → lightweight liveness check (used by Render)
//   GET /health/ready   → readiness check (DB + Redis connectivity)
//
// Why separate liveness and readiness?
//   - Liveness (/) — is the process alive? If not, restart it.
//   - Readiness (/ready) — is it ready to serve traffic? If not, don't route to it.
//   Render only uses liveness; the readiness endpoint is for future k8s/LB use.
// ─────────────────────────────────────────────────────────────────────────────

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

healthRouter.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, 'ok' | 'error'> = {
    database: 'error',
    cache: 'error',
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks['database'] = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: database unreachable');
  }

  // Check Redis
  try {
    await redis.ping();
    checks['cache'] = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: Redis unreachable');
  }

  const allHealthy = Object.values(checks).every((v) => v === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});
