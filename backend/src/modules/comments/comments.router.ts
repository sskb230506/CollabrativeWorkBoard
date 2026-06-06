import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { validate } from '@middleware/validate.middleware';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CreateCommentSchema, UpdateCommentSchema } from './comments.schema';

const commentsRepository = new CommentsRepository();
const commentsService = new CommentsService(commentsRepository);
const commentsController = new CommentsController(commentsService);

export const commentsRouter = Router();

commentsRouter.use(authenticate);

// GET /:organizationId/boards/:boardId/cards/:cardId/comments — list comments
commentsRouter.get(
  '/:organizationId/boards/:boardId/cards/:cardId/comments',
  resolveTenant,
  requireMember,
  commentsController.list,
);

// POST /:organizationId/boards/:boardId/cards/:cardId/comments — create comment
commentsRouter.post(
  '/:organizationId/boards/:boardId/cards/:cardId/comments',
  resolveTenant,
  requireMember,
  validate({ body: CreateCommentSchema }),
  commentsController.create,
);

// PATCH /:organizationId/boards/:boardId/cards/:cardId/comments/:commentId — update comment
commentsRouter.patch(
  '/:organizationId/boards/:boardId/cards/:cardId/comments/:commentId',
  resolveTenant,
  requireMember,
  validate({ body: UpdateCommentSchema }),
  commentsController.update,
);

// DELETE /:organizationId/boards/:boardId/cards/:cardId/comments/:commentId — delete comment
commentsRouter.delete(
  '/:organizationId/boards/:boardId/cards/:cardId/comments/:commentId',
  resolveTenant,
  requireMember,
  commentsController.delete,
);
