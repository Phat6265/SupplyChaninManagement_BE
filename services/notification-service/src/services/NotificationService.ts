import { Notification, INotification, NotificationType } from '../models/Notification';
import { getIO } from '../socket/socketManager';

interface CreateNotificationInput {
  title: string;
  message: string;
  type: string;
  targetUserId?: string | null;
  relatedEntity?: { kind: string; id: string; code: string };
}

export class NotificationService {
  async createAndBroadcast(input: CreateNotificationInput): Promise<INotification> {
    const notification = await Notification.create({
      title: input.title,
      message: input.message,
      type: input.type as NotificationType,
      targetUserId: input.targetUserId || null,
      relatedEntity: input.relatedEntity,
    });

    const payload = {
      _id: (notification as any)._id,
      title: input.title,
      message: input.message,
      type: input.type,
      relatedEntity: input.relatedEntity,
      createdAt: notification.createdAt,
    };

    try {
      const io = getIO();
      if (io) {
        if (input.targetUserId) {
          io.to(`user:${input.targetUserId}`).emit('notification:user', payload);
        } else {
          io.emit('notification:broadcast', payload);
        }
      }
    } catch {
      // Socket failure is non-critical
    }

    return notification;
  }

  async getForUser(userId: string, limit = 30) {
    return Notification.find({
      $or: [{ targetUserId: userId }, { targetUserId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getUnreadCount(userId: string) {
    return Notification.countDocuments({
      $or: [{ targetUserId: userId }, { targetUserId: null }],
      isRead: false,
    });
  }

  async markAsRead(notificationId: string) {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { $or: [{ targetUserId: userId }, { targetUserId: null }], isRead: false },
      { isRead: true }
    );
  }

  async countAll() { return Notification.countDocuments(); }

  async deleteNotification(notificationId: string) {
    return Notification.findByIdAndDelete(notificationId);
  }
}

export const notificationService = new NotificationService();
