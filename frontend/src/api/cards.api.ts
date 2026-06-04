import apiClient from './client';
import type { ApiResponse, Card, CardPriority } from '@appTypes';

export type CreateCardInput = {
  listId: string;
  title: string;
  description?: string | null;
  position?: number;
  priority?: CardPriority;
  dueDate?: string | null;
  coverUrl?: string | null;
  assigneeIds?: string[];
};

export type UpdateCardInput = Partial<CreateCardInput>;

export type MoveCardInput = { listId: string; position: number };

const base = (orgId: string, boardId: string) =>
  `/organizations/${orgId}/boards/${boardId}/cards`;

export const cardsApi = {
  list: (orgId: string, boardId: string) =>
    apiClient.get<ApiResponse<Card[]>>(base(orgId, boardId)).then((r) => r.data.data),

  get: (orgId: string, boardId: string, cardId: string) =>
    apiClient
      .get<ApiResponse<Card>>(`${base(orgId, boardId)}/${cardId}`)
      .then((r) => r.data.data),

  create: (orgId: string, boardId: string, data: CreateCardInput) =>
    apiClient
      .post<ApiResponse<Card>>(base(orgId, boardId), data)
      .then((r) => r.data.data),

  update: (orgId: string, boardId: string, cardId: string, data: UpdateCardInput) =>
    apiClient
      .patch<ApiResponse<Card>>(`${base(orgId, boardId)}/${cardId}`, data)
      .then((r) => r.data.data),

  move: (orgId: string, boardId: string, cardId: string, data: MoveCardInput) =>
    apiClient
      .patch<ApiResponse<Card>>(`${base(orgId, boardId)}/${cardId}/move`, data)
      .then((r) => r.data.data),

  delete: (orgId: string, boardId: string, cardId: string) =>
    apiClient
      .delete<ApiResponse<null>>(`${base(orgId, boardId)}/${cardId}`)
      .then((r) => r.data),
};
