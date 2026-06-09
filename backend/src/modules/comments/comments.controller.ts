import { Request, Response } from 'express';
import { CommentsService } from './comments.service';
import { ForbiddenError } from '../../lib/errors';
import { getIO } from '../../websocket/socket.server';
import { asyncHandler, sendSuccess, sendCreated } from '../../lib/api.helpers';
import { activitiesService } from '../activities/activities.service';
import { enqueueNotification } from '../../queue/queues';
import { prisma } from '../../prisma/client';

export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!cardId) {
      throw new Error('cardId parameter is required');
    }
    const comments = await this.commentsService.list(cardId);
    return sendSuccess(res, comments, 200, 'Comments retrieved successfully');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { cardId, boardId } = req.params;
    const { body } = req.body as { body: string };
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw new ForbiddenError();
    }
    if (!cardId || !body) {
      throw new Error('cardId and body are required');
    }
    const comment = await this.commentsService.create({
      cardId,
      userId: user.id,
      body,
    });

    // Broadcast comment_created event to board room
    const io = getIO();
    io.to(`board:${boardId}`).emit('comment_created', comment);

    // Parse comment body for mentions (e.g. @john, @johndoe, @john.doe)
    const mentions = body.match(/@([a-zA-Z0-9_.-]+)/g);
    if (mentions && mentions.length > 0) {
      const orgId = req.organizationId!;
      const members = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: { user: true },
      });

      const mentionNames = mentions.map((m) => m.slice(1).toLowerCase());

      for (const member of members) {
        // Do not notify self
        if (member.userId === user.id) continue;

        const nameNormalized = member.user.name.toLowerCase().replace(/\s+/g, '');
        const firstNameNormalized = member.user.name.toLowerCase().split(' ')[0];
        const emailPrefix = member.user.email.toLowerCase().split('@')[0];

        const isMentioned = mentionNames.some(
          (mentionName) =>
            nameNormalized === mentionName ||
            firstNameNormalized === mentionName ||
            emailPrefix === mentionName,
        );

        if (isMentioned) {
          await enqueueNotification({
            userId: member.userId,
            type: 'mention',
            payload: {
              cardId,
              mentionerId: user.id,
              commentId: comment.id,
            },
          });
        }
      }
    }

    await activitiesService.log({
      organizationId: req.params['organizationId'] || req.organizationId!,
      boardId: boardId ?? null,
      cardId,
      userId: user.id,
      action: 'comment.created',
      metadata: { commentId: comment.id, commentBody: comment.body },
    });

    return sendCreated(res, comment, 'Comment created successfully');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { cardId, boardId, commentId, organizationId } = req.params;
    const { body } = req.body as { body: string };
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw new ForbiddenError();
    }
    if (!cardId || !commentId || !body || !boardId || !organizationId) {
      throw new Error('Missing required route parameters or body');
    }
    const comment = await this.commentsService.update(
      commentId,
      cardId,
      boardId,
      organizationId,
      user.id,
      { body },
    );

    // Broadcast comment_updated event to board room
    const io = getIO();
    io.to(`board:${boardId}`).emit('comment_updated', comment);

    return sendSuccess(res, comment, 200, 'Comment updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { cardId, boardId, commentId, organizationId } = req.params;
    const user = req.user as { id: string } | undefined;
    if (!user) {
      throw new ForbiddenError();
    }
    if (!cardId || !commentId || !boardId || !organizationId) {
      throw new Error('Missing required route parameters');
    }
    await this.commentsService.delete(
      commentId,
      cardId,
      boardId,
      organizationId,
      user.id,
    );

    // Broadcast comment_deleted event to board room
    const io = getIO();
    io.to(`board:${boardId}`).emit('comment_deleted', { commentId, cardId });

    return sendSuccess(res, { commentId, cardId }, 200, 'Comment deleted successfully');
  });
}
