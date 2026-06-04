import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@context/SocketContext';
import { queryKeys } from '@api/query-keys';

// ─────────────────────────────────────────────────────────────────────────────
// useBoardSync — subscribes to board-scoped socket events and invalidates
// the relevant React Query cache keys so UI stays in sync with other users.
//
// Design decision: invalidation (not direct cache write) is used for card
// mutations from other users. This is simpler than merging unknown payloads
// and ensures data integrity. For the current user's own mutations, we use
// optimistic updates in the mutation hooks for instant feedback.
// ─────────────────────────────────────────────────────────────────────────────

export const useBoardSync = (orgId: string, boardId: string) => {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !boardId) return;

    const invalidateLists = () =>
      void qc.invalidateQueries({ queryKey: queryKeys.lists.all(orgId, boardId) });

    const invalidateCards = () =>
      void qc.invalidateQueries({ queryKey: queryKeys.cards.all(orgId, boardId) });

    socket.on('board:list:created',  invalidateLists);
    socket.on('board:list:updated',  invalidateLists);
    socket.on('board:list:deleted',  invalidateLists);
    socket.on('card:created',        invalidateCards);
    socket.on('card:updated',        invalidateCards);
    socket.on('card:deleted',        invalidateCards);
    socket.on('card:moved',          invalidateCards);

    return () => {
      socket.off('board:list:created',  invalidateLists);
      socket.off('board:list:updated',  invalidateLists);
      socket.off('board:list:deleted',  invalidateLists);
      socket.off('card:created',        invalidateCards);
      socket.off('card:updated',        invalidateCards);
      socket.off('card:deleted',        invalidateCards);
      socket.off('card:moved',          invalidateCards);
    };
  }, [socket, orgId, boardId, qc]);
};
