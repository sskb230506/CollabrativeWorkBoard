import { SearchRepository, SearchResult } from './search.repository';
import { cache, redis } from '@lib/redis';
import { logger } from '@lib/logger';

const CACHE_TTL_SECONDS = 3600; // 1 hour

export class SearchService {
  constructor(private readonly searchRepo: SearchRepository) {}

  async search(organizationId: string, query: string): Promise<SearchResult> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { boards: [], cards: [], comments: [], users: [] };
    }

    try {
      // 1. Retrieve the search cache version for this organization
      const versionKey = cache.key('org', organizationId, 'search', 'version');
      let version = await redis.get<string>(versionKey);

      if (!version) {
        version = '1';
        await redis.set(versionKey, version);
      }

      // 2. Query cache using organization ID, version, and search query
      const cacheKey = cache.key('org', organizationId, 'search', `v${version}`, trimmedQuery.toLowerCase());
      const cachedResult = await cache.get<SearchResult>(cacheKey);

      if (cachedResult) {
        logger.info({ organizationId, query: trimmedQuery, cacheKey }, 'Search cache hit');
        return cachedResult;
      }

      // 3. Cache miss: Search database in parallel using PostgreSQL FTS
      logger.info({ organizationId, query: trimmedQuery, cacheKey }, 'Search cache miss, querying database');
      const [boards, cards, comments, users] = await Promise.all([
        this.searchRepo.searchBoards(organizationId, trimmedQuery),
        this.searchRepo.searchCards(organizationId, trimmedQuery),
        this.searchRepo.searchComments(organizationId, trimmedQuery),
        this.searchRepo.searchUsers(organizationId, trimmedQuery),
      ]);

      const result: SearchResult = {
        boards,
        cards,
        comments,
        users,
      };

      // 4. Cache the results
      await cache.set(cacheKey, result, CACHE_TTL_SECONDS);

      return result;
    } catch (err) {
      logger.error({ err, organizationId, query: trimmedQuery }, 'Search service failed. Falling back to direct database query.');
      // Graceful degradation: query db directly on cache/redis failure without caching
      const [boards, cards, comments, users] = await Promise.all([
        this.searchRepo.searchBoards(organizationId, trimmedQuery),
        this.searchRepo.searchCards(organizationId, trimmedQuery),
        this.searchRepo.searchComments(organizationId, trimmedQuery),
        this.searchRepo.searchUsers(organizationId, trimmedQuery),
      ]);

      return { boards, cards, comments, users };
    }
  }
}
