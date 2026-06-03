import { Redis } from '@upstash/redis';
import { env } from '@config/env';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Upstash Redis Client (REST-based)
//
// Upstash Redis uses HTTP/REST under the hood, making it compatible with
// serverless and edge environments. We use this for:
//   - Application-level caching (boards, cards, user sessions)
//   - Rate limiting counters
//   - Socket.IO room tracking
//
// For BullMQ (which requires a raw TCP Redis connection), we use `ioredis`
// configured separately in the queue module.
// ─────────────────────────────────────────────────────────────────────────────

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ─────────────────────────────────────────────────────────────────────────────
// Cache helper utilities
// Wraps raw Redis commands with type safety and a consistent TTL API.
// ─────────────────────────────────────────────────────────────────────────────

export const cache = {
  /**
   * Get a cached value. Returns null if key doesn't exist.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(key);
    } catch (err) {
      logger.error({ err, key }, 'Cache GET error');
      return null; // Graceful degradation — don't crash on cache miss
    }
  },

  /**
   * Set a value with a TTL in seconds.
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      logger.error({ err, key }, 'Cache SET error');
    }
  },

  /**
   * Delete one or more keys.
   */
  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error({ err, keys }, 'Cache DEL error');
    }
  },

  /**
   * Build consistent, namespaced cache keys.
   * Example: cache.key('org', orgId, 'boards') → 'org:abc123:boards'
   */
  key: (...parts: string[]): string => parts.join(':'),
};
