import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listsApi, type CreateListInput } from '@api/lists.api';
import { queryKeys } from '@api/query-keys';
import type { List } from '@appTypes';

export const useLists = (orgId: string, boardId: string) =>
  useQuery({
    queryKey: queryKeys.lists.all(orgId, boardId),
    queryFn: () => listsApi.list(orgId, boardId),
    enabled: !!orgId && !!boardId,
  });

export const useCreateList = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListInput) => listsApi.create(orgId, boardId, data),
    onSuccess: (newList) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) =>
        old ? [...old, newList] : [newList],
      );
    },
  });
};

export const useUpdateList = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: Partial<CreateListInput> }) =>
      listsApi.update(orgId, boardId, listId, data),
    onSuccess: (updated) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) =>
        old?.map((l) => (l.id === updated.id ? updated : l)),
      );
    },
  });
};

export const useDeleteList = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => listsApi.delete(orgId, boardId, listId),
    onSuccess: (_, listId) => {
      qc.setQueryData<List[]>(queryKeys.lists.all(orgId, boardId), (old) =>
        old?.filter((l) => l.id !== listId),
      );
    },
  });
};
