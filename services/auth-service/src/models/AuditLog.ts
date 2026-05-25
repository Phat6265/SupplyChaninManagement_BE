import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const schema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: String,
    details: String,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

schema.index({ createdAt: -1 });
schema.index({ userId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', schema);
