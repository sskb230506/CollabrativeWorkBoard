import { CommentsRepository, DbComment, CommentCreateInput, CommentUpdateInput } from './comments.repository';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { invalidateSearchCache } from '@lib/redis';

export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async list(cardId: string): Promise<DbComment[]> {
    return this.commentsRepository.listComments(cardId);
  }

  async get(id: string): Promise<DbComment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment');
    }
    return comment;
  }

  async create(orgId: string, data: CommentCreateInput): Promise<DbComment> {
    const comment = await this.commentsRepository.create(data);
    await invalidateSearchCache(orgId);
    return comment;
  }

  async update(
    id: string,
    cardId: string,
    boardId: string,
    orgId: string,
    userId: string,
    data: CommentUpdateInput,
  ): Promise<DbComment> {
    const comment = await this.commentsRepository.findByIdScoped(id, cardId, boardId, orgId);
    if (!comment) {
      throw new NotFoundError('Comment');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }
    const updated = await this.commentsRepository.update(id, data);
    await invalidateSearchCache(orgId);
    return updated;
  }

  async delete(
    id: string,
    cardId: string,
    boardId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    const comment = await this.commentsRepository.findByIdScoped(id, cardId, boardId, orgId);
    if (!comment) {
      throw new NotFoundError('Comment');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }
    await this.commentsRepository.delete(id);
    await invalidateSearchCache(orgId);
  }
}
