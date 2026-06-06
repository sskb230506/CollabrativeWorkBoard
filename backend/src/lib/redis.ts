import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { env } from '@config/env';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Redis Client (Hybrid: Upstash REST / IORedis TCP)
//
// If Upstash REST url and token are provided, we use the REST client.
// Otherwise, we fallback to a local TCP client using ioredis.
// ─────────────────────────────────────────────────────────────────────────────

interface RedisClientInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, options?: { ex: number }): Promise<any>;
  del(...keys: string[]): Promise<any>;
  ping(): Promise<string>;
}

let redisClient: RedisClientInterface;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  logger.info('Using Upstash Redis REST client for caching');
  redisClient = new UpstashRedis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }) as unknown as RedisClientInterface;
} else {
  logger.info('Using local TCP Redis client (ioredis) for caching');
  const ioRedis = new IORedis(env.REDIS_URL || 'redis://localhost:6379');
  redisClient = {
    async get<T>(key: string): Promise<T | null> {
      const val = await ioRedis.get(key);
      if (val === null) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    },
    async set(key: string, value: any, options?: { ex: number }): Promise<any> {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (options?.ex) {
        return await ioRedis.set(key, valStr, 'EX', options.ex);
      } else {
        return await ioRedis.set(key, valStr);
      }
    },
    async del(...keys: string[]): Promise<any> {
      if (keys.length === 0) return 0;
      return await ioRedis.del(...keys);
    },
    async ping(): Promise<string> {
      return await ioRedis.ping();
    }
  };
}

export const redis = redisClient;

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
