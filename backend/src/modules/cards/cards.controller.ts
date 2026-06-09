import { Request, Response } from 'express';
import { CardsService } from './cards.service';
import { sendSuccess, sendCreated, asyncHandler } from '@lib/api.helpers';
import { CreateCardInput, UpdateCardInput } from './cards.schema';
import { getIO } from '@websocket/socket.server';
import {
  emitCardCreated,
  emitCardUpdated,
  emitCardDeleted,
  emitCardMoved,
} from '@websocket/handlers/card.handler';
import { logger } from '@lib/logger';
import { activitiesService } from '../activities/activities.service';

export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const { boardId } = req.params as { boardId: string };
    const result = await this.cardsService.createCard(
      req.organizationId!,
      boardId,
      req.body as CreateCardInput,
      (req.user as { id: string }).id,
    );
    try {
      const io = getIO();
      emitCardCreated(io, boardId, result);
    } catch (err) {
      logger.error({ err }, 'Failed to emit card:created event');
    }
    await activitiesService.log({
      organizationId: req.organizationId!,
      boardId,
      cardId: result.id,
      userId: (req.user as { id: string }).id,
      action: 'card.created',
      metadata: { cardTitle: result.title },
    });
    return sendCreated(res, result, 'Card created successfully');
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const { boardId } = req.params as { boardId: string };
    const result = await this.cardsService.listCards(req.organizationId!, boardId);
    return sendSuccess(res, result, 200, 'Cards retrieved successfully');
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, cardId } = req.params as { boardId: string; cardId: string };
    const result = await this.cardsService.getCard(req.organizationId!, boardId, cardId);
    return sendSuccess(res, result, 200, 'Card details retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, cardId } = req.params as { boardId: string; cardId: string };
    const result = await this.cardsService.updateCard(
      req.organizationId!,
      boardId,
      cardId,
      req.body as UpdateCardInput,
      (req.user as { id: string }).id,
    );
    try {
      const io = getIO();
      emitCardUpdated(io, boardId, result);
    } catch (err) {
      logger.error({ err }, 'Failed to emit card:updated event');
    }
    await activitiesService.log({
      organizationId: req.organizationId!,
      boardId,
      cardId: result.id,
      userId: (req.user as { id: string }).id,
      action: 'card.updated',
      metadata: { cardTitle: result.title },
    });
    return sendSuccess(res, result, 200, 'Card updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, cardId } = req.params as { boardId: string; cardId: string };
    await this.cardsService.deleteCard(req.organizationId!, boardId, cardId);
    try {
      const io = getIO();
      emitCardDeleted(io, boardId, cardId);
    } catch (err) {
      logger.error({ err }, 'Failed to emit card:deleted event');
    }
    return sendSuccess(res, null, 200, 'Card deleted successfully');
  });

  move = asyncHandler(async (req: Request, res: Response) => {
    const { boardId, cardId } = req.params as { boardId: string; cardId: string };
    const { listId, position } = req.body as { listId: string; position: number };
    const result = await this.cardsService.moveCard(
      req.organizationId!,
      boardId,
      cardId,
      listId,
      position,
    );
    try {
      const io = getIO();
      emitCardMoved(io, boardId, result);
    } catch (err) {
      logger.error({ err }, 'Failed to emit card:moved event');
    }
    await activitiesService.log({
      organizationId: req.organizationId!,
      boardId,
      cardId: result.id,
      userId: (req.user as { id: string }).id,
      action: 'card.moved',
      metadata: { cardTitle: result.title, listId },
    });
    return sendSuccess(res, result, 200, 'Card moved successfully');
  });
}
