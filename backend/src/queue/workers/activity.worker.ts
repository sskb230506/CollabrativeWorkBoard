import { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '@queue/queue.client';
import { ActivityJobPayload } from '@appTypes';
import { prisma } from '../../prisma/client';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Activity Worker
//
// Processes activity log jobs asynchronously.
// Decoupling activity writes from the main request/response cycle means:
//   - API responses are faster (no blocking DB write for audit trail)
//   - Failures in activity logging don't break the main operation
// ─────────────────────────────────────────────────────────────────────────────

export const activityWorker = createWorker<ActivityJobPayload>(
  QUEUE_NAMES.ACTIVITY,
  async (job: Job<ActivityJobPayload>) => {
    const { organizationId, userId, boardId, cardId, action, metadata } = job.data;

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        boardId: boardId ?? null,
        cardId: cardId ?? null,
        action,
        metadata: (metadata ?? {}) as Record<string, string>,
      },
    });

    logger.debug({ action, userId, organizationId }, 'Activity logged');
  },
  3, // concurrency — 3 parallel activity writers
);
