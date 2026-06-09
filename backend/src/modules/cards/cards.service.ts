import { CardsRepository, DbCard } from './cards.repository';
import { CreateCardInput, UpdateCardInput } from './cards.schema';
import { NotFoundError, BadRequestError } from '@lib/errors';
import { Card } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { enqueueNotification, notificationQueue } from '../../queue/queues';
import { invalidateSearchCache } from '@lib/redis';

export class CardsService {
  constructor(private readonly cardsRepo: CardsRepository) {}

  /**
   * Helper to verify that a board belongs to the organization
   */
  private async verifyBoardExists(boardId: string, organizationId: string): Promise<void> {
    const board = await prisma.board.findFirst({
      where: { id: boardId, organizationId },
    });
    if (!board) {
      throw new NotFoundError('Board');
    }
  }

  /**
   * Helper to verify a list belongs to the board and organization
   */
  private async verifyListScope(
    listId: string,
    boardId: string,
    organizationId: string,
  ): Promise<void> {
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        boardId,
        board: {
          organizationId,
        },
      },
    });
    if (!list) {
      throw new NotFoundError('List');
    }
  }

  /**
   * Helper to verify assignee user IDs are members of the organization
   */
  private async verifyAssignees(organizationId: string, assigneeIds: string[]): Promise<void> {
    if (assigneeIds.length === 0) return;

    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        userId: { in: assigneeIds },
      },
      select: { userId: true },
    });

    if (members.length !== assigneeIds.length) {
      throw new BadRequestError('All assignees must be members of the organization');
    }
  }

  /**
   * Creates a new card
   */
  async createCard(
    organizationId: string,
    boardId: string,
    input: CreateCardInput,
    userId: string,
  ): Promise<Card> {
    await this.verifyBoardExists(boardId, organizationId);
    await this.verifyListScope(input.listId, boardId, organizationId);

    const assigneeIds = input.assigneeIds ?? [];
    await this.verifyAssignees(organizationId, assigneeIds);

    let position = input.position;
    if (position === undefined) {
      const existingCards = await prisma.card.findMany({
        where: { listId: input.listId },
        select: { position: true },
      });
      if (existingCards.length === 0) {
        position = 1000;
      } else {
        const maxPos = Math.max(...existingCards.map((c) => c.position));
        position = maxPos + 1000;
      }
    }

    const createData = {
      listId: input.listId,
      title: input.title,
      description: input.description ?? null,
      position,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      coverUrl: input.coverUrl ?? null,
    };

    const card = await this.cardsRepo.createCard(createData, assigneeIds);

    // Enqueue assignment notifications (excluding the creator)
    const otherAssignees = assigneeIds.filter((id) => id !== userId);
    for (const assigneeId of otherAssignees) {
      await enqueueNotification({
        userId: assigneeId,
        type: 'assignment',
        payload: { cardId: card.id, assignerId: userId },
      });
    }

    // Schedule due date reminder if due date is set
    if (input.dueDate) {
      const dueDateObj = new Date(input.dueDate);
      const timeUntilDue = dueDateObj.getTime() - Date.now();
      if (timeUntilDue > 0) {
        const delay = Math.max(0, timeUntilDue - 24 * 60 * 60 * 1000);
        await notificationQueue.add(
          'send-notification',
          {
            userId: '',
            type: 'due_date_reminder',
            payload: { cardId: card.id, dueDate: dueDateObj.toISOString() },
          },
          { delay, jobId: `due-reminder-${card.id}` },
        );
      }
    }

    await invalidateSearchCache(organizationId);
    return card;
  }

  /**
   * Lists all cards on a board
   */
  async listCards(organizationId: string, boardId: string): Promise<Card[]> {
    await this.verifyBoardExists(boardId, organizationId);
    return this.cardsRepo.listCards(boardId, organizationId);
  }

  /**
   * Retrieves card detail scoped to tenant
   */
  async getCard(organizationId: string, boardId: string, cardId: string): Promise<DbCard> {
    await this.verifyBoardExists(boardId, organizationId);
    const card = await this.cardsRepo.findByIdScoped(cardId, boardId, organizationId);
    if (!card) {
      throw new NotFoundError('Card');
    }
    return card;
  }

  /**
   * Updates an existing card
   */
  async updateCard(
    organizationId: string,
    boardId: string,
    cardId: string,
    input: UpdateCardInput,
    userId: string,
  ): Promise<Card> {
    // Verify target card exists in tenant
    const existingCard = await this.getCard(organizationId, boardId, cardId);

    if (input.listId !== undefined) {
      await this.verifyListScope(input.listId, boardId, organizationId);
    }

    if (input.assigneeIds !== undefined) {
      await this.verifyAssignees(organizationId, input.assigneeIds);
    }

    const updateData: {
      listId?: string;
      title?: string;
      description?: string | null;
      position?: number;
      priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
      dueDate?: Date | null;
      coverUrl?: string | null;
    } = {};

    if (input.listId !== undefined) {
      updateData.listId = input.listId;
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.position !== undefined) {
      updateData.position = input.position;
    }
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate;
    }
    if (input.coverUrl !== undefined) {
      updateData.coverUrl = input.coverUrl;
    }

    const updatedCard = await this.cardsRepo.updateScoped(
      cardId,
      boardId,
      organizationId,
      updateData,
      input.assigneeIds,
    );

    // If assignees were modified, notify newly assigned users (excluding self)
    if (input.assigneeIds !== undefined) {
      const currentAssigneeIds = existingCard.assignees.map((a) => a.userId);
      const newlyAssigned = input.assigneeIds.filter(
        (id) => !currentAssigneeIds.includes(id) && id !== userId,
      );

      for (const assigneeId of newlyAssigned) {
        await enqueueNotification({
          userId: assigneeId,
          type: 'assignment',
          payload: { cardId, assignerId: userId },
        });
      }
    }

    // If due date was updated or removed, update the delayed job
    if (input.dueDate !== undefined) {
      // Clear existing job
      const existingJob = await notificationQueue.getJob(`due-reminder-${cardId}`);
      if (existingJob) {
        await existingJob.remove();
      }

      // Schedule new one if due date is not removed
      if (input.dueDate) {
        const dueDateObj = new Date(input.dueDate);
        const timeUntilDue = dueDateObj.getTime() - Date.now();
        if (timeUntilDue > 0) {
          const delay = Math.max(0, timeUntilDue - 24 * 60 * 60 * 1000);
          await notificationQueue.add(
            'send-notification',
            {
              userId: '',
              type: 'due_date_reminder',
              payload: { cardId, dueDate: dueDateObj.toISOString() },
            },
            { delay, jobId: `due-reminder-${cardId}` },
          );
        }
      }
    }

    await invalidateSearchCache(organizationId);
    return updatedCard;
  }

  /**
   * Deletes a card
   */
  async deleteCard(organizationId: string, boardId: string, cardId: string): Promise<void> {
    await this.getCard(organizationId, boardId, cardId); // throws if not found
    await this.cardsRepo.deleteScoped(cardId, boardId, organizationId);
    await invalidateSearchCache(organizationId);
  }

  /**
   * Moves a card across lists or positions
   */
  async moveCard(
    organizationId: string,
    boardId: string,
    cardId: string,
    targetListId: string,
    position: number,
  ): Promise<Card> {
    await this.getCard(organizationId, boardId, cardId); // throws if not found
    await this.verifyListScope(targetListId, boardId, organizationId);

    const result = await this.cardsRepo.updateScoped(cardId, boardId, organizationId, {
      listId: targetListId,
      position,
    });
    await invalidateSearchCache(organizationId);
    return result;
  }
}
