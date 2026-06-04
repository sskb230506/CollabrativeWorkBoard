import apiClient from './client';
import type { ApiResponse, List } from '@appTypes';

export type CreateListInput = { name: string; position?: number };
export type UpdateListInput = Partial<CreateListInput>;

const base = (orgId: string, boardId: string) =>
  `/organizations/${orgId}/boards/${boardId}/lists`;

export const listsApi = {
  list: (orgId: string, boardId: string) =>
    apiClient.get<ApiResponse<List[]>>(base(orgId, boardId)).then((r) => r.data.data),

  get: (orgId: string, boardId: string, listId: string) =>
    apiClient
      .get<ApiResponse<List>>(`${base(orgId, boardId)}/${listId}`)
      .then((r) => r.data.data),

  create: (orgId: string, boardId: string, data: CreateListInput) =>
    apiClient
      .post<ApiResponse<List>>(base(orgId, boardId), data)
      .then((r) => r.data.data),

  update: (orgId: string, boardId: string, listId: string, data: UpdateListInput) =>
    apiClient
      .patch<ApiResponse<List>>(`${base(orgId, boardId)}/${listId}`, data)
      .then((r) => r.data.data),

  delete: (orgId: string, boardId: string, listId: string) =>
    apiClient
      .delete<ApiResponse<null>>(`${base(orgId, boardId)}/${listId}`)
      .then((r) => r.data),
};
