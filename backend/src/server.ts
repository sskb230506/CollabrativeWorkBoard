// ─────────────────────────────────────────────────────────────────────────────
// Server Entry Point
//
// Responsibilities:
//   1. Bootstrap the Express app
//   2. Connect to the database
//   3. Start the HTTP server
//   4. Initialize Socket.IO
//   5. Start BullMQ workers
//   6. Register graceful shutdown handlers
//
// Why separate app.ts from server.ts?
//   - app.ts exports the Express Application for integration testing
//   - server.ts handles process-level concerns (ports, signals, DB connections)
// ─────────────────────────────────────────────────────────────────────────────

import { createServer } from 'http';
import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@lib/logger';
import { connectDatabase, disconnectDatabase } from './prisma/client';
import { initSocketServer } from '@websocket/socket.server';
import { activityWorker } from '@queue/workers/activity.worker';
import { closeQueues } from '@queue/queues';

const bootstrap = async (): Promise<void> => {
  // ── 1. Connect to DB before accepting traffic ───────────────────────────
  await connectDatabase();

  // ── 2. Create Express app ───────────────────────────────────────────────
  const app = createApp();

  // ── 3. Create HTTP server (needed for Socket.IO to attach to) ──────────
  const httpServer = createServer(app);

  // ── 4. Initialize Socket.IO ────────────────────────────────────────────
  const io = initSocketServer(httpServer);

  // ── 5. Start HTTP server ───────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        api: `/api/${env.API_VERSION}`,
      },
      `🚀 Server running on port ${env.PORT}`,
    );
  });

  // ── 6. Graceful shutdown ───────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received — starting graceful shutdown');

    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info('HTTP server closed');
    });

    // Close Socket.IO
    await io.close();
    logger.info('Socket.IO server closed');

    // Close BullMQ workers and queues
    await activityWorker.close();
    await closeQueues();
    logger.info('BullMQ workers and queues closed');

    // Disconnect from DB
    await disconnectDatabase();

    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM')); // Render sends SIGTERM
  process.on('SIGINT',  () => void shutdown('SIGINT'));  // Ctrl+C in dev

  // Catch unhandled errors — log and exit to let Render restart the service
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to bootstrap server');
  process.exit(1);
});
