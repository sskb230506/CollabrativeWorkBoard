import apiClient from './client';
import type { ApiResponse, Board } from '@appTypes';

export type CreateBoardInput = {
  name: string;
  description?: string | undefined;
  coverUrl?: string | undefined;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ORGANIZATION' | undefined;
};

export type UpdateBoardInput = Partial<CreateBoardInput>;

export const boardsApi = {
  list: (organizationId: string) =>
    apiClient
      .get<ApiResponse<Board[]>>(`/organizations/${organizationId}/boards`)
      .then((r) => r.data.data),

  get: (organizationId: string, boardId: string) =>
    apiClient
      .get<ApiResponse<Board>>(`/organizations/${organizationId}/boards/${boardId}`)
      .then((r) => r.data.data),

  create: (organizationId: string, data: CreateBoardInput) =>
    apiClient
      .post<ApiResponse<Board>>(`/organizations/${organizationId}/boards`, data)
      .then((r) => r.data.data),

  update: (organizationId: string, boardId: string, data: UpdateBoardInput) =>
    apiClient
      .patch<ApiResponse<Board>>(`/organizations/${organizationId}/boards/${boardId}`, data)
      .then((r) => r.data.data),

  delete: (organizationId: string, boardId: string) =>
    apiClient
      .delete<ApiResponse<null>>(`/organizations/${organizationId}/boards/${boardId}`)
      .then((r) => r.data),
};
