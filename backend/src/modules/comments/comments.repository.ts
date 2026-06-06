import { Comment } from '@prisma/client';
import { BaseRepository } from '../../repositories/base.repository';
import { Nullable } from '../../types';

export type DbComment = Comment & {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type CommentCreateInput = {
  cardId: string;
  userId: string;
  body: string;
};

export type CommentUpdateInput = {
  body: string;
};

export class CommentsRepository extends BaseRepository<
  DbComment,
  CommentCreateInput,
  CommentUpdateInput
> {
  protected readonly modelName = 'Comment';

  async findById(id: string): Promise<Nullable<DbComment>> {
    return this.db.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    }) as Promise<Nullable<DbComment>>;
  }

  async findByIdScoped(
    id: string,
    cardId: string,
    boardId: string,
    organizationId: string,
  ): Promise<Nullable<DbComment>> {
    return this.db.comment.findFirst({
      where: {
        id,
        cardId,
        card: {
          id: cardId,
          list: {
            boardId,
            board: {
              organizationId,
            },
          },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    }) as Promise<Nullable<DbComment>>;
  }

  async listComments(cardId: string): Promise<DbComment[]> {
    return this.db.comment.findMany({
      where: { cardId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<DbComment[]>;
  }

  async create(data: CommentCreateInput): Promise<DbComment> {
    const comment = await this.db.comment.create({
      data: {
        cardId: data.cardId,
        userId: data.userId,
        body: data.body,
      },
    });
    const result = await this.findById(comment.id);
    if (!result) {
      throw new Error('Failed to retrieve created comment');
    }
    return result;
  }

  async update(id: string, data: CommentUpdateInput): Promise<DbComment> {
    await this.db.comment.update({
      where: { id },
      data: {
        body: data.body,
      },
    });
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Failed to retrieve updated comment');
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.comment.delete({
      where: { id },
    });
  }
}
