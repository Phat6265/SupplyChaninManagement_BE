import { Schema, model, Document, Types } from 'mongoose';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

interface IPOItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: Types.ObjectId;
  warehouseId: string;
  items: IPOItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: Date;
  notes?: string;
  createdBy: string;
}

const itemSchema = new Schema<IPOItem>({
  productId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const schema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouseId: { type: String, required: true },
    items: [itemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PurchaseOrderStatus), default: PurchaseOrderStatus.DRAFT },
    expectedDeliveryDate: Date,
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

schema.index({ poNumber: 1 });
schema.index({ supplierId: 1 });
schema.index({ warehouseId: 1 });
schema.index({ status: 1 });

export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', schema);
