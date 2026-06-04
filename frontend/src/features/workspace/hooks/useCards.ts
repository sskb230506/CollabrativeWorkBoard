import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi, type CreateCardInput, type MoveCardInput } from '@api/cards.api';
import { queryKeys } from '@api/query-keys';
import type { Card } from '@appTypes';

export const useCards = (orgId: string, boardId: string) =>
  useQuery({
    queryKey: queryKeys.cards.all(orgId, boardId),
    queryFn: () => cardsApi.list(orgId, boardId),
    enabled: !!orgId && !!boardId,
  });

export const useCreateCard = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardInput) => cardsApi.create(orgId, boardId, data),
    onSuccess: (newCard) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) =>
        old ? [...old, newCard] : [newCard],
      );
    },
  });
};

export const useMoveCard = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: MoveCardInput }) =>
      cardsApi.move(orgId, boardId, cardId, data),
    onMutate: async ({ cardId, data }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.cards.all(orgId, boardId) });
      const previous = qc.getQueryData<Card[]>(queryKeys.cards.all(orgId, boardId));

      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) =>
        old?.map((c) =>
          c.id === cardId
            ? { ...c, listId: data.listId, position: data.position }
            : c,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on failure
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.cards.all(orgId, boardId), ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cards.all(orgId, boardId) });
    },
  });
};

export const useDeleteCard = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => cardsApi.delete(orgId, boardId, cardId),
    onSuccess: (_, cardId) => {
      qc.setQueryData<Card[]>(queryKeys.cards.all(orgId, boardId), (old) =>
        old?.filter((c) => c.id !== cardId),
      );
    },
  });
};
