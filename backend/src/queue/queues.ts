import { Queue } from 'bullmq';
import { createQueue, QUEUE_NAMES } from '@queue/queue.client';
import { EmailJobPayload, ActivityJobPayload, NotificationJobPayload } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Queue Instances
//
// Queues are initialized once and imported wherever jobs need to be enqueued.
// Workers are initialized separately (in workers/) and can be spun up
// independently — e.g., in a separate Render worker service for horizontal
// scaling of background jobs.
// ─────────────────────────────────────────────────────────────────────────────

export const emailQueue: Queue<EmailJobPayload> = createQueue<EmailJobPayload>(QUEUE_NAMES.EMAIL);

export const activityQueue: Queue<ActivityJobPayload> = createQueue<ActivityJobPayload>(
  QUEUE_NAMES.ACTIVITY,
);

export const notificationQueue: Queue<NotificationJobPayload> =
  createQueue<NotificationJobPayload>(QUEUE_NAMES.NOTIFICATION);

// ─────────────────────────────────────────────────────────────────────────────
// Job enqueuers — typed convenience functions used by services
// ─────────────────────────────────────────────────────────────────────────────

export const enqueueEmail = async (payload: EmailJobPayload): Promise<void> => {
  await emailQueue.add('send-email', payload);
};

export const enqueueActivity = async (payload: ActivityJobPayload): Promise<void> => {
  // Activities are fire-and-forget; delay slightly to let the main transaction commit
  await activityQueue.add('log-activity', payload, { delay: 500 });
};

export const enqueueNotification = async (payload: NotificationJobPayload): Promise<void> => {
  await notificationQueue.add('send-notification', payload);
};

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown — drain queues before process exit
// ─────────────────────────────────────────────────────────────────────────────

export const closeQueues = async (): Promise<void> => {
  await Promise.all([
    emailQueue.close(),
    activityQueue.close(),
    notificationQueue.close(),
  ]);
};
