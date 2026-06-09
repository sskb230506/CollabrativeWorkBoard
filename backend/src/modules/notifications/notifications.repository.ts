import { Prisma, Notification } from '@prisma/client';
import { BaseRepository } from '@repositories/base.repository';
import { Nullable } from '@appTypes';

export type DbNotification = Notification;

export type NotificationCreateInput = {
  userId: string;
  organizationId: string;
  type: string;
  title?: string | null;
  body: string;
  metadata?: Record<string, unknown> | null;
};

export type NotificationUpdateInput = {
  isRead?: boolean;
};

export class NotificationsRepository extends BaseRepository<
  DbNotification,
  NotificationCreateInput,
  NotificationUpdateInput
> {
  protected readonly modelName = 'Notification';

  async findById(id: string): Promise<Nullable<DbNotification>> {
    return this.db.notification.findUnique({
      where: { id },
    });
  }

  async listNotifications(userId: string, organizationId: string, limit = 50): Promise<DbNotification[]> {
    return this.db.notification.findMany({
      where: { userId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(data: NotificationCreateInput): Promise<DbNotification> {
    return this.db.notification.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        type: data.type,
        title: data.title ?? null,
        body: data.body,
        metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, data: NotificationUpdateInput): Promise<DbNotification> {
    return this.db.notification.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.notification.delete({
      where: { id },
    });
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true },
    });
  }
}
