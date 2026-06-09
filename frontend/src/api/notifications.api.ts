import apiClient from './client';
import type { ApiResponse, Notification } from '@appTypes';

export const notificationsApi = {
  list: (orgId: string, limit = 50) =>
    apiClient
      .get<ApiResponse<Notification[]>>(`/organizations/${orgId}/notifications`, {
        params: { limit },
      })
      .then((r) => r.data.data),

  markAsRead: (orgId: string, notificationId: string) =>
    apiClient
      .patch<ApiResponse<Notification>>(`/organizations/${orgId}/notifications/${notificationId}/read`)
      .then((r) => r.data.data),

  markAllAsRead: (orgId: string) =>
    apiClient
      .post<ApiResponse<null>>(`/organizations/${orgId}/notifications/read-all`)
      .then((r) => r.data.data),
};
