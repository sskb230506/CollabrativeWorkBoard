import { env } from './env';

// ─────────────────────────────────────────────────────────────────────────────
// Centralized application configuration
// Keeps magic numbers and strings out of business logic.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    apiVersion: env.API_VERSION,
    apiPrefix: `/api/${env.API_VERSION}`,
  },

  cors: {
    // Parse comma-separated origins from env
    origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
  },

  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    bcryptRounds: 12, // Intentionally higher than default (10) for production security
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: 'workboard',
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  },

  redis: {
    restUrl: env.UPSTASH_REDIS_REST_URL,
    restToken: env.UPSTASH_REDIS_REST_TOKEN,
    rawUrl: env.REDIS_URL,
    // Cache TTLs in seconds
    ttl: {
      short: 60,           // 1 minute
      medium: 60 * 15,     // 15 minutes
      long: 60 * 60,       // 1 hour
      day: 60 * 60 * 24,   // 24 hours
    },
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

export type AppConfig = typeof config;
