import apiClient from './client';
import type { ApiResponse, Organization } from '@appTypes';

export type CreateOrgInput = { name: string; slug: string };

export const organizationsApi = {
  list: () =>
    apiClient.get<ApiResponse<Organization[]>>('/organizations').then((r) => r.data.data),

  get: (orgId: string) =>
    apiClient
      .get<ApiResponse<Organization>>(`/organizations/${orgId}`)
      .then((r) => r.data.data),

  create: (data: CreateOrgInput) =>
    apiClient
      .post<ApiResponse<Organization>>('/organizations', data)
      .then((r) => r.data.data),
};
