import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember, requireAdmin } from '@middleware/rbac.middleware';
import { validate } from '@middleware/validate.middleware';
import { BoardsRepository } from './boards.repository';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { CreateBoardSchema, UpdateBoardSchema } from './boards.schema';

const boardsRepository = new BoardsRepository();
const boardsService = new BoardsService(boardsRepository);
const boardsController = new BoardsController(boardsService);

export const boardsRouter = Router();

// All board routes require authentication
boardsRouter.use(authenticate);

// GET /:organizationId/boards — list organization boards
boardsRouter.get(
  '/:organizationId/boards',
  resolveTenant,
  requireMember,
  boardsController.list,
);

// POST /:organizationId/boards — create board (member or higher)
boardsRouter.post(
  '/:organizationId/boards',
  resolveTenant,
  requireMember,
  validate({ body: CreateBoardSchema }),
  boardsController.create,
);

// GET /:organizationId/boards/:boardId — retrieve board details
boardsRouter.get(
  '/:organizationId/boards/:boardId',
  resolveTenant,
  requireMember,
  boardsController.get,
);

// PATCH /:organizationId/boards/:boardId — update board details
boardsRouter.patch(
  '/:organizationId/boards/:boardId',
  resolveTenant,
  requireMember,
  validate({ body: UpdateBoardSchema }),
  boardsController.update,
);

// DELETE /:organizationId/boards/:boardId — delete board (admin or higher)
boardsRouter.delete(
  '/:organizationId/boards/:boardId',
  resolveTenant,
  requireAdmin,
  boardsController.delete,
);
