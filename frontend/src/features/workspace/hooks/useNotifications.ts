import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@api/notifications.api';
import { queryKeys } from '@api/query-keys';
import type { Notification } from '@appTypes';
import { useSocket } from '@context/SocketContext';
import { useEffect } from 'react';

export const useNotifications = (orgId: string) => {
  const qc = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !orgId) return;

    const handleNotificationCreated = (newNotification: Notification) => {
      qc.setQueryData<Notification[]>(
        queryKeys.notifications.all(orgId),
        (old) => {
          if (!old) return [newNotification];
          if (old.some((n) => n.id === newNotification.id)) return old;
          return [newNotification, ...old];
        }
      );
    };

    socket.on('notification_created', handleNotificationCreated);

    return () => {
      socket.off('notification_created', handleNotificationCreated);
    };
  }, [socket, orgId, qc]);

  return useQuery({
    queryKey: queryKeys.notifications.all(orgId),
    queryFn: () => notificationsApi.list(orgId),
    enabled: !!orgId,
  });
};

export const useMarkNotificationAsRead = (orgId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(orgId, notificationId),
    onSuccess: (updatedNotification) => {
      qc.setQueryData<Notification[]>(
        queryKeys.notifications.all(orgId),
        (old) => {
          if (!old) return [];
          return old.map((n) =>
            n.id === updatedNotification.id ? updatedNotification : n
          );
        }
      );
    },
  });
};

export const useMarkAllNotificationsAsRead = (orgId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(orgId),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(
        queryKeys.notifications.all(orgId),
        (old) => {
          if (!old) return [];
          return old.map((n) => ({ ...n, isRead: true }));
        }
      );
    },
  });
};
