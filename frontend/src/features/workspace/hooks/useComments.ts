import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi, type CreateCommentInput, type UpdateCommentInput } from '@api/comments.api';
import { queryKeys } from '@api/query-keys';
import type { Comment } from '@appTypes';

export const useComments = (orgId: string, boardId: string, cardId: string) =>
  useQuery({
    queryKey: queryKeys.comments.all(orgId, boardId, cardId),
    queryFn: () => commentsApi.list(orgId, boardId, cardId),
    enabled: !!orgId && !!boardId && !!cardId,
  });

export const useCreateComment = (orgId: string, boardId: string, cardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentInput) =>
      commentsApi.create(orgId, boardId, cardId, data),
    onSuccess: (newComment) => {
      qc.setQueryData<Comment[]>(
        queryKeys.comments.all(orgId, boardId, cardId),
        (old) => (old ? [...old, newComment] : [newComment])
      );
    },
  });
};

export const useUpdateComment = (orgId: string, boardId: string, cardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentInput }) =>
      commentsApi.update(orgId, boardId, cardId, commentId, data),
    onSuccess: (updatedComment) => {
      qc.setQueryData<Comment[]>(
        queryKeys.comments.all(orgId, boardId, cardId),
        (old) => old?.map((c) => (c.id === updatedComment.id ? updatedComment : c))
      );
    },
  });
};

export const useDeleteComment = (orgId: string, boardId: string, cardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.delete(orgId, boardId, cardId, commentId),
    onSuccess: (deletedInfo) => {
      qc.setQueryData<Comment[]>(
        queryKeys.comments.all(orgId, boardId, cardId),
        (old) => old?.filter((c) => c.id !== deletedInfo.commentId)
      );
    },
  });
};
