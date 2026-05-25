import { Schema, model, Document, Types } from 'mongoose';

export enum SalesOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ISalesOrder extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: SalesOrderStatus;
  expectedDeliveryDate?: Date;
  shippingAddress: { street: string; city: string; state: string; zipCode: string; country: string };
  notes?: string;
  createdBy: string;
}

const itemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const schema = new Schema<ISalesOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [itemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(SalesOrderStatus), default: SalesOrderStatus.PENDING },
    expectedDeliveryDate: Date,
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

schema.index({ orderNumber: 1 });
schema.index({ customerId: 1 });
schema.index({ status: 1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ createdBy: 1, createdAt: -1 });

export const SalesOrder = model<ISalesOrder>('SalesOrder', schema);
