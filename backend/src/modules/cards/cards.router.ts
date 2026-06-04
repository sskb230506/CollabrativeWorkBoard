import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { validate } from '@middleware/validate.middleware';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CreateCardSchema, UpdateCardSchema } from './cards.schema';
import { z } from 'zod';

const cardsRepository = new CardsRepository();
const cardsService = new CardsService(cardsRepository);
const cardsController = new CardsController(cardsService);

export const cardsRouter = Router();

// All card routes require authentication
cardsRouter.use(authenticate);

// GET /:organizationId/boards/:boardId/cards — list all cards on a board
cardsRouter.get(
  '/:organizationId/boards/:boardId/cards',
  resolveTenant,
  requireMember,
  cardsController.list,
);

// POST /:organizationId/boards/:boardId/cards — create a new card
cardsRouter.post(
  '/:organizationId/boards/:boardId/cards',
  resolveTenant,
  requireMember,
  validate({ body: CreateCardSchema }),
  cardsController.create,
);

// GET /:organizationId/boards/:boardId/cards/:cardId — get card details
cardsRouter.get(
  '/:organizationId/boards/:boardId/cards/:cardId',
  resolveTenant,
  requireMember,
  cardsController.get,
);

// PATCH /:organizationId/boards/:boardId/cards/:cardId — update card details
cardsRouter.patch(
  '/:organizationId/boards/:boardId/cards/:cardId',
  resolveTenant,
  requireMember,
  validate({ body: UpdateCardSchema }),
  cardsController.update,
);

// DELETE /:organizationId/boards/:boardId/cards/:cardId — delete card
cardsRouter.delete(
  '/:organizationId/boards/:boardId/cards/:cardId',
  resolveTenant,
  requireMember,
  cardsController.delete,
);

// PATCH /:organizationId/boards/:boardId/cards/:cardId/move — move card
cardsRouter.patch(
  '/:organizationId/boards/:boardId/cards/:cardId/move',
  resolveTenant,
  requireMember,
  validate({
    body: z.object({
      listId: z.string().uuid('Invalid list ID'),
      position: z.number({ invalid_type_error: 'Position must be a number' }),
    }),
  }),
  cardsController.move,
);
