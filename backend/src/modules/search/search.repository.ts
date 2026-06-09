import { prisma } from '../../prisma/client';

export interface SearchResult {
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
  }>;
  cards: Array<{
    id: string;
    title: string;
    description: string | null;
    boardId: string;
    boardName: string;
    listId: string;
    listName: string;
  }>;
  comments: Array<{
    id: string;
    body: string;
    cardId: string;
    cardTitle: string;
    boardId: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }>;
}

export class SearchRepository {
  async searchBoards(organizationId: string, query: string): Promise<SearchResult['boards']> {
    const ilikeQuery = `%${query}%`;
    return prisma.$queryRaw<SearchResult['boards']>`
      SELECT id, name, description, "coverUrl"
      FROM boards
      WHERE "organizationId" = ${organizationId}
        AND (
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('english', ${query})
          OR name ILIKE ${ilikeQuery}
          OR description ILIKE ${ilikeQuery}
        )
      LIMIT 10
    `;
  }

  async searchCards(organizationId: string, query: string): Promise<SearchResult['cards']> {
    const ilikeQuery = `%${query}%`;
    return prisma.$queryRaw<SearchResult['cards']>`
      SELECT c.id, c.title, c.description, b.id as "boardId", b.name as "boardName", c."listId", l.name as "listName"
      FROM cards c
      JOIN lists l ON c."listId" = l.id
      JOIN boards b ON l."boardId" = b.id
      WHERE b."organizationId" = ${organizationId}
        AND (
          to_tsvector('english', coalesce(c.title, '') || ' ' || coalesce(c.description, '')) @@ websearch_to_tsquery('english', ${query})
          OR c.title ILIKE ${ilikeQuery}
          OR c.description ILIKE ${ilikeQuery}
        )
      LIMIT 15
    `;
  }

  async searchComments(organizationId: string, query: string): Promise<SearchResult['comments']> {
    const ilikeQuery = `%${query}%`;
    return prisma.$queryRaw<SearchResult['comments']>`
      SELECT co.id, co.body, co."cardId", c.title as "cardTitle", b.id as "boardId"
      FROM comments co
      JOIN cards c ON co."cardId" = c.id
      JOIN lists l ON c."listId" = l.id
      JOIN boards b ON l."boardId" = b.id
      WHERE b."organizationId" = ${organizationId}
        AND (
          to_tsvector('english', co.body) @@ websearch_to_tsquery('english', ${query})
          OR co.body ILIKE ${ilikeQuery}
        )
      LIMIT 15
    `;
  }

  async searchUsers(organizationId: string, query: string): Promise<SearchResult['users']> {
    const ilikeQuery = `%${query}%`;
    return prisma.$queryRaw<SearchResult['users']>`
      SELECT u.id, u.name, u.email, u."avatarUrl"
      FROM users u
      JOIN organization_members om ON u.id = om."userId"
      WHERE om."organizationId" = ${organizationId}
        AND (
          to_tsvector('english', coalesce(u.name, '') || ' ' || coalesce(u.email, '')) @@ websearch_to_tsquery('english', ${query})
          OR u.name ILIKE ${ilikeQuery}
          OR u.email ILIKE ${ilikeQuery}
        )
      LIMIT 10
    `;
  }
}
