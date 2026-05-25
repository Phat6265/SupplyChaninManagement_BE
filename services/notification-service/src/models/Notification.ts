import { Schema, model, Document, Types } from 'mongoose';

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  SHIPMENT_STATUS = 'shipment_status',
  INVENTORY_ALERT = 'inventory_alert',
  SYSTEM = 'system',
}

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  targetUserId?: Types.ObjectId;
  relatedEntity?: { kind: string; id: string; code: string };
  isRead: boolean;
  createdAt: Date;
}

const schema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.SYSTEM,
    },
    targetUserId: { type: Schema.Types.ObjectId, default: null },
    relatedEntity: {
      kind: String,
      id: String,
      code: String,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ targetUserId: 1, isRead: 1 });
schema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', schema);
