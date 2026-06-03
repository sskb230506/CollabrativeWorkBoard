import { PrismaClient } from '@prisma/client';
import { env, isDev } from '../config/env';
import { logger } from '../lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Singleton
// Using relative imports here to avoid the @prisma alias conflicting with
// the @prisma/client npm package.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
    datasources: {
      db: { url: env.DATABASE_URL },
    },
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (isDev) {
  globalThis.__prisma = prisma;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('warn', (e: { message: string }) => {
  logger.warn({ message: e.message }, 'Prisma warning');
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('error', (e: { message: string }) => {
  logger.error({ message: e.message }, 'Prisma error');
});

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('✅ Database connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
