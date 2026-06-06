import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@context/SocketContext';
import { queryKeys } from '@api/query-keys';
import type { Card, List } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// useBoardSync — subscribes to board-scoped socket events and synchronizes
// the relevant React Query cache keys so UI stays in sync with other users.
// ─────────────────────────────────────────────────────────────────────────────

export const useBoardSync = (orgId: string, boardId: string) => {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !boardId) return;

    const handleCardCreated = (newCard: Card) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) => {
        if (!old) return old;
        if (old.some((c) => c.id === newCard.id)) return old;
        return [...old, newCard];
      });
    };

    const handleCardUpdated = (updatedCard: Card) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      });
    };

    const handleCardDeleted = ({ cardId }: { cardId: string }) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== cardId);
      });
    };

    const handleCardMoved = (movedCard: Card) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === movedCard.id ? movedCard : c));
      });
    };

    const handleListCreated = (newList: List) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) => {
        if (!old) return old;
        if (old.some((l) => l.id === newList.id)) return old;
        return [...old, newList];
      });
    };

    const handleListUpdated = (updatedList: List) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) => {
        if (!old) return old;
        return old.map((l) => (l.id === updatedList.id ? updatedList : l));
      });
    };

    const handleListDeleted = ({ listId }: { listId: string }) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) => {
        if (!old) return old;
        return old.filter((l) => l.id !== listId);
      });
    };

    socket.on('board:list:created',  handleListCreated);
    socket.on('board:list:updated',  handleListUpdated);
    socket.on('board:list:deleted',  handleListDeleted);
    socket.on('card:created',        handleCardCreated);
    socket.on('card:updated',        handleCardUpdated);
    socket.on('card:deleted',        handleCardDeleted);
    socket.on('card:moved',          handleCardMoved);

    return () => {
      socket.off('board:list:created',  handleListCreated);
      socket.off('board:list:updated',  handleListUpdated);
      socket.off('board:list:deleted',  handleListDeleted);
      socket.off('card:created',        handleCardCreated);
      socket.off('card:updated',        handleCardUpdated);
      socket.off('card:deleted',        handleCardDeleted);
      socket.off('card:moved',          handleCardMoved);
    };
  }, [socket, orgId, boardId, qc]);
};

