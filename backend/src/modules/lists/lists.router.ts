import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { validate } from '@middleware/validate.middleware';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { CreateListSchema, UpdateListSchema } from './lists.schema';

const listsRepository = new ListsRepository();
const listsService = new ListsService(listsRepository);
const listsController = new ListsController(listsService);

export const listsRouter = Router();

// All list routes require authentication
listsRouter.use(authenticate);

// GET /:organizationId/boards/:boardId/lists — list all lists in a board
listsRouter.get(
  '/:organizationId/boards/:boardId/lists',
  resolveTenant,
  requireMember,
  listsController.list,
);

// POST /:organizationId/boards/:boardId/lists — create a new list
listsRouter.post(
  '/:organizationId/boards/:boardId/lists',
  resolveTenant,
  requireMember,
  validate({ body: CreateListSchema }),
  listsController.create,
);

// GET /:organizationId/boards/:boardId/lists/:listId — get list details
listsRouter.get(
  '/:organizationId/boards/:boardId/lists/:listId',
  resolveTenant,
  requireMember,
  listsController.get,
);

// PATCH /:organizationId/boards/:boardId/lists/:listId — update list details
listsRouter.patch(
  '/:organizationId/boards/:boardId/lists/:listId',
  resolveTenant,
  requireMember,
  validate({ body: UpdateListSchema }),
  listsController.update,
);

// DELETE /:organizationId/boards/:boardId/lists/:listId — delete list
listsRouter.delete(
  '/:organizationId/boards/:boardId/lists/:listId',
  resolveTenant,
  requireMember,
  listsController.delete,
);
