import { redis, cache } from '../lib/redis';
import { logger } from '../lib/logger';
import { PresenceEntry } from '../types';

const PRESENCE_TIMEOUT_MS = 40_000; // 40 seconds
const PRESENCE_TTL_SEC = 40; // 40 seconds

export class PresenceService {
  /**
   * Set user presence for a connected socket.
   */
  static async setUserPresence(
    socketId: string,
    data: {
      userId: string;
      name: string | undefined;
      avatarUrl: string | null | undefined;
      organizationId: string;
      boardId?: string | null;
    }
  ): Promise<void> {
    const key = cache.key('presence', 'socket', socketId);
    const now = Date.now();
    const entry: PresenceEntry = {
      userId: data.userId,
      name: data.name,
      avatarUrl: data.avatarUrl,
      boardId: data.boardId || null,
      organizationId: data.organizationId,
      socketId,
      lastSeen: now,
    };

    try {
      // Store socket details with TTL
      await redis.set(key, entry, { ex: PRESENCE_TTL_SEC });

      // Add to global sockets ZSET
      await redis.zadd(cache.key('presence', 'global', 'sockets'), now, socketId);

      // Add to organization ZSET
      await redis.zadd(cache.key('presence', 'org', data.organizationId, 'sockets'), now, socketId);

      // Add to active orgs ZSET
      await redis.zadd(cache.key('presence', 'active', 'orgs'), now, data.organizationId);

      if (data.boardId) {
        // Add to board ZSET
        await redis.zadd(cache.key('presence', 'board', data.boardId, 'sockets'), now, socketId);
        // Add to active boards ZSET
        await redis.zadd(cache.key('presence', 'active', 'boards'), now, data.boardId);
      }
    } catch (err) {
      logger.error({ err, socketId, userId: data.userId }, 'Failed to set user presence');
    }
  }

  /**
   * Remove user presence when socket disconnects.
   */
  static async removeUserPresence(socketId: string): Promise<{
    userId: string;
    organizationId: string;
    boardId: string | null;
  } | null> {
    const key = cache.key('presence', 'socket', socketId);

    try {
      // Fetch details before deleting
      const entry = await redis.get<PresenceEntry>(key);
      if (!entry) return null;

      // Delete socket key
      await redis.del(key);

      // Remove from ZSETs
      await redis.zrem(cache.key('presence', 'global', 'sockets'), socketId);
      await redis.zrem(cache.key('presence', 'org', entry.organizationId, 'sockets'), socketId);
      
      if (entry.boardId) {
        await redis.zrem(cache.key('presence', 'board', entry.boardId, 'sockets'), socketId);
        
        // Clean active boards if empty
        const boardCount = await redis.zcard(cache.key('presence', 'board', entry.boardId, 'sockets'));
        if (boardCount === 0) {
          await redis.zrem(cache.key('presence', 'active', 'boards'), entry.boardId);
        }
      }

      // Clean active orgs if empty
      const orgCount = await redis.zcard(cache.key('presence', 'org', entry.organizationId, 'sockets'));
      if (orgCount === 0) {
        await redis.zrem(cache.key('presence', 'active', 'orgs'), entry.organizationId);
      }

      return {
        userId: entry.userId,
        organizationId: entry.organizationId,
        boardId: entry.boardId,
      };
    } catch (err) {
      logger.error({ err, socketId }, 'Failed to remove user presence');
      return null;
    }
  }

  /**
   * Add socket to a specific board.
   */
  static async joinBoard(socketId: string, boardId: string): Promise<PresenceEntry | null> {
    const key = cache.key('presence', 'socket', socketId);
    const now = Date.now();

    try {
      const entry = await redis.get<PresenceEntry>(key);
      if (!entry) return null;

      // If user was previously in a different board, leave it first
      if (entry.boardId && entry.boardId !== boardId) {
        await this.leaveBoard(socketId);
      }

      entry.boardId = boardId;
      entry.lastSeen = now;

      // Update socket metadata in Redis
      await redis.set(key, entry, { ex: PRESENCE_TTL_SEC });

      // Add to board ZSET
      await redis.zadd(cache.key('presence', 'board', boardId, 'sockets'), now, socketId);
      // Add to active boards ZSET
      await redis.zadd(cache.key('presence', 'active', 'boards'), now, boardId);

      return entry;
    } catch (err) {
      logger.error({ err, socketId, boardId }, 'Failed to join board presence');
      return null;
    }
  }

  /**
   * Remove socket from a specific board.
   */
  static async leaveBoard(socketId: string): Promise<{
    userId: string;
    organizationId: string;
    boardId: string;
  } | null> {
    const key = cache.key('presence', 'socket', socketId);
    const now = Date.now();

    try {
      const entry = await redis.get<PresenceEntry>(key);
      if (!entry || !entry.boardId) return null;

      const oldBoardId = entry.boardId;
      entry.boardId = null;
      entry.lastSeen = now;

      // Update socket metadata in Redis
      await redis.set(key, entry, { ex: PRESENCE_TTL_SEC });

      // Remove from board ZSET
      await redis.zrem(cache.key('presence', 'board', oldBoardId, 'sockets'), socketId);

      // Clean active boards if empty
      const boardCount = await redis.zcard(cache.key('presence', 'board', oldBoardId, 'sockets'));
      if (boardCount === 0) {
        await redis.zrem(cache.key('presence', 'active', 'boards'), oldBoardId);
      }

      return {
        userId: entry.userId,
        organizationId: entry.organizationId,
        boardId: oldBoardId,
      };
    } catch (err) {
      logger.error({ err, socketId }, 'Failed to leave board presence');
      return null;
    }
  }

  /**
   * Get active users on a board, with self-healing cleanup of expired sockets.
   */
  static async getBoardPresence(boardId: string): Promise<PresenceEntry[]> {
    const zsetKey = cache.key('presence', 'board', boardId, 'sockets');
    const now = Date.now();
    const threshold = now - PRESENCE_TIMEOUT_MS;

    try {
      // 1. Remove expired sockets from ZSET
      await redis.zremrangebyscore(zsetKey, '-inf', threshold);

      // 2. Fetch active socket IDs
      const socketIds = await redis.zrange(zsetKey, 0, -1);
      if (socketIds.length === 0) return [];

      // 3. Fetch metadata for active sockets
      const keys = socketIds.map(id => cache.key('presence', 'socket', id));
      const metadatas = await redis.mget<PresenceEntry>(keys);

      const activeEntries: PresenceEntry[] = [];
      const expiredSocketIds: string[] = [];

      for (let i = 0; i < socketIds.length; i++) {
        const socketId = socketIds[i];
        if (!socketId) continue;
        const meta = metadatas[i];
        if (meta) {
          activeEntries.push(meta);
        } else {
          // Socket metadata expired but socketId still in ZSET, mark for removal
          expiredSocketIds.push(socketId);
        }
      }

      // 4. Lazy cleanup of orphaned socket IDs in ZSET
      if (expiredSocketIds.length > 0) {
        await redis.zrem(zsetKey, ...expiredSocketIds);
        // Recalculate board count and clean active boards if 0
        const boardCount = await redis.zcard(zsetKey);
        if (boardCount === 0) {
          await redis.zrem(cache.key('presence', 'active', 'boards'), boardId);
        }
      }

      // 5. Deduplicate by userId so active tabs for the same user only show once
      const uniqueMap = new Map<string, PresenceEntry>();
      for (const entry of activeEntries) {
        const existing = uniqueMap.get(entry.userId);
        // Keep the most recently seen entry
        if (!existing || entry.lastSeen > existing.lastSeen) {
          uniqueMap.set(entry.userId, entry);
        }
      }

      return Array.from(uniqueMap.values());
    } catch (err) {
      logger.error({ err, boardId }, 'Failed to get board presence');
      return [];
    }
  }

  /**
   * Get active users in an organization, with self-healing cleanup.
   */
  static async getOrgPresence(orgId: string): Promise<PresenceEntry[]> {
    const zsetKey = cache.key('presence', 'org', orgId, 'sockets');
    const now = Date.now();
    const threshold = now - PRESENCE_TIMEOUT_MS;

    try {
      // 1. Remove expired sockets from ZSET
      await redis.zremrangebyscore(zsetKey, '-inf', threshold);

      // 2. Fetch active socket IDs
      const socketIds = await redis.zrange(zsetKey, 0, -1);
      if (socketIds.length === 0) return [];

      // 3. Fetch metadata
      const keys = socketIds.map(id => cache.key('presence', 'socket', id));
      const metadatas = await redis.mget<PresenceEntry>(keys);

      const activeEntries: PresenceEntry[] = [];
      const expiredSocketIds: string[] = [];

      for (let i = 0; i < socketIds.length; i++) {
        const socketId = socketIds[i];
        if (!socketId) continue;
        const meta = metadatas[i];
        if (meta) {
          activeEntries.push(meta);
        } else {
          expiredSocketIds.push(socketId);
        }
      }

      // 4. Lazy cleanup of ZSET
      if (expiredSocketIds.length > 0) {
        await redis.zrem(zsetKey, ...expiredSocketIds);
        const orgCount = await redis.zcard(zsetKey);
        if (orgCount === 0) {
          await redis.zrem(cache.key('presence', 'active', 'orgs'), orgId);
        }
      }

      // 5. Deduplicate by userId
      const uniqueMap = new Map<string, PresenceEntry>();
      for (const entry of activeEntries) {
        const existing = uniqueMap.get(entry.userId);
        if (!existing || entry.lastSeen > existing.lastSeen) {
          uniqueMap.set(entry.userId, entry);
        }
      }

      return Array.from(uniqueMap.values());
    } catch (err) {
      logger.error({ err, orgId }, 'Failed to get org presence');
      return [];
    }
  }
}
