// ─────────────────────────────────────────────────────────────────────────────
// React Query Key Factory
//
// Design decisions:
//   - Hierarchical key arrays allow fine-grained cache invalidation.
//     e.g. invalidating ['boards', orgId] also invalidates
//     ['boards', orgId, boardId] because React Query matches prefixes.
//   - Centralising keys prevents "magic string" bugs where two useQuery
//     calls that should share a cache don't, because their key strings differ.
// ─────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    detail: (orgId: string) => ['organizations', orgId] as const,
    members: (orgId: string) => ['organizations', orgId, 'members'] as const,
  },

  // Boards
  boards: {
    all: (orgId: string) => ['boards', orgId] as const,
    detail: (orgId: string, boardId: string) => ['boards', orgId, boardId] as const,
  },

  // Lists
  lists: {
    all: (orgId: string, boardId: string) => ['lists', orgId, boardId] as const,
    detail: (orgId: string, boardId: string, listId: string) =>
      ['lists', orgId, boardId, listId] as const,
  },

  // Cards
  cards: {
    all: (orgId: string, boardId: string) => ['cards', orgId, boardId] as const,
    detail: (orgId: string, boardId: string, cardId: string) =>
      ['cards', orgId, boardId, cardId] as const,
  },

  // Comments
  comments: {
    all: (orgId: string, boardId: string, cardId: string) =>
      ['comments', orgId, boardId, cardId] as const,
  },

  // Notifications
  notifications: {
    all: (orgId: string) => ['notifications', orgId] as const,
  },
} as const;
