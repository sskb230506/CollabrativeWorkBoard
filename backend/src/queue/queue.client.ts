import { Queue, Worker, QueueEvents, ConnectionOptions, Job } from 'bullmq';
import { env } from '@config/env';
import { logger } from '@lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// BullMQ Redis Connection
//
// BullMQ requires a raw TCP/TLS Redis connection — it cannot use the Upstash
// REST API like our caching layer. We use the REDIS_URL env var which should
// point to Upstash's Redis endpoint with TLS (rediss://).
//
// Tradeoff: Upstash free tier limits concurrent connections. For high-traffic,
// consider Upstash Pro or a dedicated Redis instance.
// ─────────────────────────────────────────────────────────────────────────────

export const bullConnection: ConnectionOptions = {
  // Parse the redis URL so BullMQ can connect
  // Format: rediss://default:PASSWORD@HOST:PORT
  url: env.REDIS_URL,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required for Upstash compatibility
};

// ─────────────────────────────────────────────────────────────────────────────
// Queue Names — centralized to prevent typo-driven bugs
// ─────────────────────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: 'email',
  ACTIVITY: 'activity',
  NOTIFICATION: 'notification',
  CLEANUP: 'cleanup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─────────────────────────────────────────────────────────────────────────────
// Queue Factory
// Creates a BullMQ Queue with consistent defaults.
// ─────────────────────────────────────────────────────────────────────────────

export const createQueue = <T>(name: string): Queue<T> => {
  const queue = new Queue<T>(name, {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000, // Start at 1s, then 2s, 4s
      },
      removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
      removeOnFail: { count: 500 },      // Keep last 500 failed for debugging
    },
  });

  queue.on('error', (err) => {
    logger.error({ err, queue: name }, 'BullMQ Queue error');
  });

  logger.info({ queue: name }, 'BullMQ Queue initialized');
  return queue;
};

// ─────────────────────────────────────────────────────────────────────────────
// Worker Factory
// ─────────────────────────────────────────────────────────────────────────────

export const createWorker = <T>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processor: (job: Job<T>) => Promise<any>,
  concurrency = 5,
): Worker<T> => {
  const worker = new Worker<T>(name, processor, {
    connection: bullConnection,
    concurrency,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: name, err }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err, queue: name }, 'Worker error');
  });

  logger.info({ queue: name, concurrency }, 'BullMQ Worker initialized');
  return worker;
};

// ─────────────────────────────────────────────────────────────────────────────
// Queue Events Factory (for monitoring)
// ─────────────────────────────────────────────────────────────────────────────

export const createQueueEvents = (name: string): QueueEvents => {
  return new QueueEvents(name, { connection: bullConnection });
};
