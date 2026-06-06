import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

export type DbActivityLog = Awaited<ReturnType<PrismaClient['activityLog']['findUniqueOrThrow']>> & {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  board?: {
    id: string;
    name: string;
  } | null;
  card?: {
    id: string;
    title: string;
  } | null;
};

export type ActivityLogCreateInput = {
  organizationId: string;
  boardId?: string | null;
  cardId?: string | null;
  userId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
};

export class ActivitiesRepository extends BaseRepository<
  DbActivityLog,
  ActivityLogCreateInput,
  Record<string, never>
> {
  protected readonly modelName = 'ActivityLog';

  async findById(id: string): Promise<Nullable<DbActivityLog>> {
    const result = await this.db.activityLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        board: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
    return result as DbActivityLog | null;
  }

  async listActivities(organizationId: string, limit = 50): Promise<DbActivityLog[]> {
    const results = await this.db.activityLog.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        board: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return results as DbActivityLog[];
  }

  async create(data: ActivityLogCreateInput): Promise<DbActivityLog> {
    const created = await this.db.activityLog.create({
      data: {
        organizationId: data.organizationId,
        boardId: data.boardId ?? null,
        cardId: data.cardId ?? null,
        userId: data.userId,
        action: data.action,
        metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    const result = await this.findById(created.id);
    if (!result) {
      throw new Error('Failed to retrieve created activity log');
    }
    return result;
  }

  update(_id: string, _data: Record<string, never>): Promise<DbActivityLog> {
    throw new Error('Activity logs cannot be updated');
  }

  delete(_id: string): Promise<void> {
    throw new Error('Activity logs cannot be deleted');
  }
}
