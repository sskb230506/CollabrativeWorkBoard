import { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '@queue/queue.client';
import { NotificationJobPayload } from '@appTypes';
import { prisma } from '../../prisma/client';
import { notificationsService } from '../../modules/notifications/notifications.service';
import { logger } from '@lib/logger';

export const notificationWorker = createWorker<NotificationJobPayload>(
  QUEUE_NAMES.NOTIFICATION,
  async (job: Job<NotificationJobPayload>) => {
    const { userId, type, payload } = job.data;

    logger.debug({ jobId: job.id, type, userId }, 'Processing notification job');

    try {
      if (type === 'assignment') {
        const cardId = payload.cardId as string;
        const assignerId = payload.assignerId as string;

        const card = await prisma.card.findUnique({
          where: { id: cardId },
          include: { list: { include: { board: true } } },
        });

        if (!card) {
          logger.warn({ cardId }, 'Assignment notification skipped: card not found');
          return;
        }

        const assigner = await prisma.user.findUnique({
          where: { id: assignerId },
        });

        if (!assigner) {
          logger.warn({ assignerId }, 'Assignment notification skipped: assigner not found');
          return;
        }

        await notificationsService.create({
          userId,
          organizationId: card.list.board.organizationId,
          type: 'assignment',
          title: 'New Card Assignment',
          body: `${assigner.name} assigned you to the card "${card.title}" on board "${card.list.board.name}"`,
          metadata: {
            cardId: card.id,
            boardId: card.list.board.id,
          },
        });
      }

      else if (type === 'mention') {
        const cardId = payload.cardId as string;
        const mentionerId = payload.mentionerId as string;
        const commentId = payload.commentId as string;

        const card = await prisma.card.findUnique({
          where: { id: cardId },
          include: { list: { include: { board: true } } },
        });

        if (!card) {
          logger.warn({ cardId }, 'Mention notification skipped: card not found');
          return;
        }

        const mentioner = await prisma.user.findUnique({
          where: { id: mentionerId },
        });

        if (!mentioner) {
          logger.warn({ mentionerId }, 'Mention notification skipped: mentioner not found');
          return;
        }

        await notificationsService.create({
          userId,
          organizationId: card.list.board.organizationId,
          type: 'mention',
          title: 'Mentioned in Comment',
          body: `${mentioner.name} mentioned you in a comment on card "${card.title}"`,
          metadata: {
            cardId: card.id,
            boardId: card.list.board.id,
            commentId,
          },
        });
      }

      else if (type === 'due_date_reminder') {
        const cardId = payload.cardId as string;
        const expectedDueDateStr = payload.dueDate as string;

        const card = await prisma.card.findUnique({
          where: { id: cardId },
          include: {
            list: { include: { board: true } },
            assignees: { include: { user: true } },
          },
        });

        if (!card || !card.dueDate) {
          logger.warn({ cardId }, 'Due date reminder skipped: card or due date not found');
          return;
        }

        // Verify that the due date hasn't changed since this job was scheduled
        const expectedDueDate = new Date(expectedDueDateStr);
        if (Math.abs(card.dueDate.getTime() - expectedDueDate.getTime()) > 10000) {
          logger.info({ cardId }, 'Due date reminder skipped: due date was updated');
          return;
        }

        // Send a notification to each assigned user
        for (const assignee of card.assignees) {
          await notificationsService.create({
            userId: assignee.userId,
            organizationId: card.list.board.organizationId,
            type: 'due_date_reminder',
            title: 'Card Due Soon',
            body: `The card "${card.title}" on board "${card.list.board.name}" is due soon: ${card.dueDate.toLocaleString()}`,
            metadata: {
              cardId: card.id,
              boardId: card.list.board.id,
            },
          });
        }
      }
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Error processing notification job');
      throw error; // Let BullMQ retry
    }
  },
  2, // concurrency
);
