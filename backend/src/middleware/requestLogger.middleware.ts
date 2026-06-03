import pinoHttp from 'pino-http';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Request Logger Middleware (pino-http)
//
// Logs every request/response with:
//   - method, url, statusCode, responseTime
//   - requestId (auto-generated UUID, attached to req for downstream use)
//   - userId (if authenticated)
//
// In production, this produces structured NDJSON consumable by log aggregators.
// Health checks are excluded to avoid polluting logs with noise.
// ─────────────────────────────────────────────────────────────────────────────

export const requestLogger = pinoHttp({
  logger,
  // Auto-generate a unique request ID for tracing across log lines
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] ?? crypto.randomUUID();
    res.setHeader('X-Request-ID', id as string);
    return id;
  },
  // Suppress health check noise
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
  },
  customLogLevel: (_req, res, err) => {
    if (err || (res.statusCode && res.statusCode >= 500)) return 'error';
    if (res.statusCode && res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      // Never log Authorization headers
      headers: {
        'content-type': req.headers['content-type'],
        'x-organization-id': req.headers['x-organization-id'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
