import pino from 'pino';
import { env, isDev } from '@config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Structured Logger (Pino)
//
// Why Pino over Winston/console.log?
// - ~5x faster than Winston due to async write buffering
// - Outputs NDJSON in production (machine-parseable by Datadog, Loki, etc.)
// - Pretty-prints in development via pino-pretty
// - Structured fields make log querying trivial (e.g., filter by requestId)
// ─────────────────────────────────────────────────────────────────────────────

export const logger = pino({
  level: env.LOG_LEVEL,
  // In production, emit raw JSON. In dev, use pino-pretty for readability.
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: include base fields on every log line
        base: {
          service: 'workboard-api',
          env: env.NODE_ENV,
        },
        // ISO timestamp in production for log aggregators
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

export type Logger = typeof logger;
