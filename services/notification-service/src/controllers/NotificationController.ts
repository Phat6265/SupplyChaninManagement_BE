import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class NotificationController {
  /**
   * ✅ Returns { notifications, unreadCount } — matches original backend NotificationController.getMyNotifications
   */
  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const limit = parseInt(req.query.limit as string) || 30;
      const notifications = await notificationService.getForUser(userId, limit);
      const unreadCount = await notificationService.getUnreadCount(userId);
      ok(res, { notifications, unreadCount });
    } catch (e: any) { err(res, e.message); }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      ok(res, notification, 'Marked as read');
    } catch (e: any) { err(res, e.message); }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      await notificationService.markAllAsRead(userId);
      ok(res, null, 'All notifications marked as read');
    } catch (e: any) { err(res, e.message); }
  }

  /** Internal endpoint — called by other services without auth */
  async createInternal(req: Request, res: Response): Promise<void> {
    try {
      const notification = await notificationService.createAndBroadcast(req.body);
      ok(res, notification, 'Notification sent', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      await notificationService.deleteNotification(req.params.id);
      ok(res, null, 'Notification deleted');
    } catch (e: any) { err(res, e.message); }
  }
}

export const notificationController = new NotificationController();
