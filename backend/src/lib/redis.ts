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
  set(key: string, value: unknown, options?: { ex: number }): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
  ping(): Promise<string>;
  
  // ZSET operations
  zadd(key: string, score: number, member: string): Promise<number>;
  zrem(key: string, ...members: string[]): Promise<number>;
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
  zrange(key: string, min: number, max: number): Promise<string[]>;
  zcard(key: string): Promise<number>;

  // Batch get
  mget<T>(keys: string[]): Promise<(T | null)[]>;
}

let redisClient: RedisClientInterface;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  logger.info('Using Upstash Redis REST client for caching');
  const upstash = new UpstashRedis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  redisClient = {
    async get<T>(key: string): Promise<T | null> {
      return await upstash.get<T>(key);
    },
    async set(key: string, value: unknown, options?: { ex: number }): Promise<unknown> {
      if (options?.ex) {
        return await upstash.set(key, value, { ex: options.ex });
      }
      return await upstash.set(key, value);
    },
    async del(...keys: string[]): Promise<unknown> {
      if (keys.length === 0) return 0;
      return await upstash.del(...keys);
    },
    async ping(): Promise<string> {
      return await upstash.ping();
    },
    async zadd(key: string, score: number, member: string): Promise<number> {
      const res = await upstash.zadd(key, { score, member });
      return res ?? 0;
    },
    async zrem(key: string, ...members: string[]): Promise<number> {
      if (members.length === 0) return 0;
      return await upstash.zrem(key, ...members);
    },
    async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      return await upstash.zremrangebyscore(key, min as any, max as any);
    },
    async zrange(key: string, min: number, max: number): Promise<string[]> {
      return await upstash.zrange<string[]>(key, min, max);
    },
    async zcard(key: string): Promise<number> {
      return await upstash.zcard(key);
    },
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
      if (keys.length === 0) return [];
      const res = await upstash.mget<(T | null)[]>(...keys);
      return res || [];
    }
  };
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
    async set(key: string, value: unknown, options?: { ex: number }): Promise<unknown> {
      const valStr = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
      if (options?.ex) {
        return await ioRedis.set(key, valStr, 'EX', options.ex);
      } else {
        return await ioRedis.set(key, valStr);
      }
    },
    async del(...keys: string[]): Promise<unknown> {
      if (keys.length === 0) return 0;
      return await ioRedis.del(...keys);
    },
    async ping(): Promise<string> {
      return await ioRedis.ping();
    },
    async zadd(key: string, score: number, member: string): Promise<number> {
      return await ioRedis.zadd(key, score, member);
    },
    async zrem(key: string, ...members: string[]): Promise<number> {
      if (members.length === 0) return 0;
      return await ioRedis.zrem(key, ...members);
    },
    async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
      return await ioRedis.zremrangebyscore(key, min, max);
    },
    async zrange(key: string, min: number, max: number): Promise<string[]> {
      return await ioRedis.zrange(key, min, max);
    },
    async zcard(key: string): Promise<number> {
      return await ioRedis.zcard(key);
    },
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
      if (keys.length === 0) return [];
      const res = await ioRedis.mget(...keys);
      return res.map(val => {
        if (val === null) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      });
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

/**
 * Invalidates the search cache for a specific organization by updating its search version.
 */
export const invalidateSearchCache = async (organizationId: string): Promise<void> => {
  try {
    await redis.set(cache.key('org', organizationId, 'search', 'version'), Date.now().toString());
  } catch (err) {
    logger.error({ err, organizationId }, 'Failed to invalidate search cache');
  }
};
