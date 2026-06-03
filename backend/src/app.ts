import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from '@config/app.config';
import { globalLimiter } from '@middleware/rateLimiter.middleware';
import { requestLogger } from '@middleware/requestLogger.middleware';
import { errorHandler, notFoundHandler } from '@middleware/error.middleware';
import { apiRouter } from '@routes/api.router';

// ─────────────────────────────────────────────────────────────────────────────
// Express Application Factory
//
// Returns the configured Express app. Separating this from server.ts lets us
// import the app in integration tests without starting an HTTP server.
//
// Middleware order is critical in Express — security headers before routes,
// error handler last.
// ─────────────────────────────────────────────────────────────────────────────

export const createApp = (): Application => {
  const app = express();

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(
    helmet({
      // Content Security Policy — tighten in production once you know all sources
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
        },
      },
      crossOriginEmbedderPolicy: false, // Needed for Cloudinary embeds
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (config.cors.origins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS policy: origin '${origin}' not allowed`));
      },
      credentials: config.cors.credentials,
      methods: [...config.cors.methods],
      allowedHeaders: [...config.cors.allowedHeaders],
    }),
  );

  // ── Performance ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Logging ───────────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Trust proxy (required for Render, which sits behind a load balancer) ──
  // This ensures req.ip returns the real client IP, not the proxy's IP.
  // Set to 1 (trust one hop). Do not set to `true` in production — it trusts
  // all X-Forwarded-For headers, which is a security risk.
  app.set('trust proxy', 1);

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use(`/api/${config.server.apiVersion}`, apiRouter);

  // ── Root liveness (Render health check) ──────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // ── 404 ──────────────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global Error Handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
};
