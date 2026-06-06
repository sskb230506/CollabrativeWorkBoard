import apiClient from './client';
import type { ApiResponse, ActivityLog } from '@appTypes';

export const activitiesApi = {
  list: (orgId: string, limit = 50) =>
    apiClient
      .get<ApiResponse<ActivityLog[]>>(`/organizations/${orgId}/activities`, {
        params: { limit },
      })
      .then((r) => r.data.data),
};
