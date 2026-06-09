import { NotificationsRepository, NotificationCreateInput, DbNotification } from './notifications.repository';
import { getIO } from '../../websocket/socket.server';
import { logger } from '../../lib/logger';
import { NotFoundError } from '../../lib/errors';

export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async create(data: NotificationCreateInput): Promise<DbNotification> {
    const notification = await this.notificationsRepository.create(data);
    try {
      const io = getIO();
      // Broadcast to the user's private socket room
      io.to(`user:${data.userId}`).emit('notification_created', notification);
      logger.debug({ userId: data.userId, notificationId: notification.id }, 'Notification emitted via Socket.IO');
    } catch (err) {
      logger.error({ err }, 'Failed to emit notification_created socket event');
    }
    return notification;
  }

  async list(userId: string, organizationId: string, limit = 50): Promise<DbNotification[]> {
    return this.notificationsRepository.listNotifications(userId, organizationId, limit);
  }

  async markAsRead(id: string, userId: string, organizationId: string): Promise<DbNotification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification || notification.userId !== userId || notification.organizationId !== organizationId) {
      throw new NotFoundError('Notification');
    }

    return this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    await this.notificationsRepository.markAllAsRead(userId, organizationId);
  }
}

const notificationsRepository = new NotificationsRepository();
export const notificationsService = new NotificationsService(notificationsRepository);
