import apiClient from './client';
import type { ApiResponse, Comment } from '@appTypes';

export type CreateCommentInput = {
  body: string;
};

export type UpdateCommentInput = {
  body: string;
};

const base = (orgId: string, boardId: string, cardId: string) =>
  `/organizations/${orgId}/boards/${boardId}/cards/${cardId}/comments`;

export const commentsApi = {
  list: (orgId: string, boardId: string, cardId: string) =>
    apiClient
      .get<ApiResponse<Comment[]>>(base(orgId, boardId, cardId))
      .then((r) => r.data.data),

  create: (orgId: string, boardId: string, cardId: string, data: CreateCommentInput) =>
    apiClient
      .post<ApiResponse<Comment>>(base(orgId, boardId, cardId), data)
      .then((r) => r.data.data),

  update: (orgId: string, boardId: string, cardId: string, commentId: string, data: UpdateCommentInput) =>
    apiClient
      .patch<ApiResponse<Comment>>(`${base(orgId, boardId, cardId)}/${commentId}`, data)
      .then((r) => r.data.data),

  delete: (orgId: string, boardId: string, cardId: string, commentId: string) =>
    apiClient
      .delete<ApiResponse<{ commentId: string; cardId: string }>>(`${base(orgId, boardId, cardId)}/${commentId}`)
      .then((r) => r.data.data),
};
