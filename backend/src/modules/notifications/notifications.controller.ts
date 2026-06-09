import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess, asyncHandler } from '../../lib/api.helpers';

export class NotificationsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const notifications = await notificationsService.list(req.user!.id, req.organizationId!, limit);
    return sendSuccess(res, notifications, 200, 'Notifications retrieved successfully');
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { notificationId } = req.params;
    const notification = await notificationsService.markAsRead(
      notificationId!,
      req.user!.id,
      req.organizationId!,
    );
    return sendSuccess(res, notification, 200, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markAllAsRead(req.user!.id, req.organizationId!);
    return sendSuccess(res, null, 200, 'All notifications marked as read');
  });
}
