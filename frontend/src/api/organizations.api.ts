import apiClient from './client';
import type { ApiResponse, Organization } from '@appTypes';

export type CreateOrgInput = { name: string; logoUrl?: string | null };

export type OrganizationMember = {
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

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

  listMembers: (orgId: string) =>
    apiClient
      .get<ApiResponse<OrganizationMember[]>>(`/organizations/${orgId}/members`)
      .then((r) => r.data.data),
};
