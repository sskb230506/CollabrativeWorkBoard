import apiClient from './client';
import type { ApiResponse } from '@appTypes';

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

export const searchApi = {
  execute: (orgId: string, query: string): Promise<SearchResult> =>
    apiClient
      .get<ApiResponse<SearchResult>>(`/organizations/${orgId}/search`, {
        params: { q: query },
      })
      .then((r) => r.data.data),
};
