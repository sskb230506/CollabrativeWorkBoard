import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@api/activities.api';
import type { ActivityLog } from '@appTypes';
import { useSocket } from '@context/SocketContext';
import { useEffect } from 'react';

export const useActivities = (orgId: string) => {
  const qc = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !orgId) return;

    const handleActivityCreated = (newActivity: ActivityLog) => {
      qc.setQueryData<ActivityLog[]>(
        ['activities', orgId],
        (old) => {
          if (!old) return [newActivity];
          if (old.some((a) => a.id === newActivity.id)) return old;
          return [newActivity, ...old];
        }
      );
    };

    socket.on('activity_created', handleActivityCreated);

    return () => {
      socket.off('activity_created', handleActivityCreated);
    };
  }, [socket, orgId, qc]);

  return useQuery({
    queryKey: ['activities', orgId],
    queryFn: () => activitiesApi.list(orgId),
    enabled: !!orgId,
  });
};
