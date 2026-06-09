import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { resolveTenant, requireMember } from '@middleware/rbac.middleware';
import { NotificationsController } from './notifications.controller';

const notificationsController = new NotificationsController();

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get(
  '/:organizationId/notifications',
  resolveTenant,
  requireMember,
  notificationsController.list,
);

notificationsRouter.patch(
  '/:organizationId/notifications/:notificationId/read',
  resolveTenant,
  requireMember,
  notificationsController.markAsRead,
);

notificationsRouter.post(
  '/:organizationId/notifications/read-all',
  resolveTenant,
  requireMember,
  notificationsController.markAllAsRead,
);
