import { Schema, model, Document, Types } from 'mongoose';

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum ReturnType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export interface IReturn extends Document {
  returnNumber: string;
  salesOrderId: Types.ObjectId;
  customerId: Types.ObjectId;
  type: ReturnType;
  status: ReturnStatus;
  items: Array<{ productId: Types.ObjectId; quantity: number; reason: string }>;
  notes?: string;
  refundAmount?: number;
  createdBy: string;
}

const schema = new Schema<IReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, trim: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: Object.values(ReturnType), required: true },
    status: { type: String, enum: Object.values(ReturnStatus), default: ReturnStatus.PENDING },
    items: [{
      productId: { type: Schema.Types.ObjectId, required: true },
      quantity: { type: Number, required: true, min: 1 },
      reason: { type: String, required: true },
    }],
    notes: String,
    refundAmount: { type: Number, min: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

schema.index({ returnNumber: 1 });
schema.index({ salesOrderId: 1 });
schema.index({ status: 1 });

export const Return = model<IReturn>('Return', schema);
