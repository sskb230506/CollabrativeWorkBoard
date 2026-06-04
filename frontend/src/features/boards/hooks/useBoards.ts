import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi, type CreateBoardInput, type UpdateBoardInput } from '@api/boards.api';
import { queryKeys } from '@api/query-keys';
import type { Board } from '@appTypes';

export const useBoards = (orgId: string) =>
  useQuery({
    queryKey: queryKeys.boards.all(orgId),
    queryFn: () => boardsApi.list(orgId),
    enabled: !!orgId,
  });

export const useBoard = (orgId: string, boardId: string) =>
  useQuery({
    queryKey: queryKeys.boards.detail(orgId, boardId),
    queryFn: () => boardsApi.get(orgId, boardId),
    enabled: !!orgId && !!boardId,
  });

export const useCreateBoard = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardInput) => boardsApi.create(orgId, data),
    onSuccess: (newBoard) => {
      qc.setQueryData<Board[]>(queryKeys.boards.all(orgId), (old) =>
        old ? [newBoard, ...old] : [newBoard],
      );
    },
  });
};

export const useUpdateBoard = (orgId: string, boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBoardInput) => boardsApi.update(orgId, boardId, data),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.boards.detail(orgId, boardId), updated);
      qc.setQueryData<Board[]>(queryKeys.boards.all(orgId), (old) =>
        old?.map((b) => (b.id === boardId ? updated : b)),
      );
    },
  });
};

export const useDeleteBoard = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => boardsApi.delete(orgId, boardId),
    onSuccess: (_, boardId) => {
      qc.removeQueries({ queryKey: queryKeys.boards.detail(orgId, boardId) });
      qc.setQueryData<Board[]>(queryKeys.boards.all(orgId), (old) =>
        old?.filter((b) => b.id !== boardId),
      );
    },
  });
};
