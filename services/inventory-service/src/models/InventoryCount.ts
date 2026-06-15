import { Schema, model } from 'mongoose';

interface ICountItem {
  productId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
}

interface IInventoryCount {
  countCode: string;
  warehouseId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: ICountItem[];
  notes?: string;
  createdBy: string;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const countItemSchema = new Schema<ICountItem>(
  {
    productId: { type: String, required: true },
    expectedQuantity: { type: Number, required: true, default: 0 },
    actualQuantity: { type: Number, required: true, default: 0 },
    difference: { type: Number, default: 0 },
  },
  { _id: false }
);

const schema = new Schema<IInventoryCount>(
  {
    countCode: { type: String, required: true, unique: true, trim: true },
    warehouseId: { type: String, required: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
    },
    items: { type: [countItemSchema], required: true },
    notes: String,
    createdBy: { type: String, required: true },
    completedBy: String,
    completedAt: Date,
  },
  { timestamps: true }
);

schema.index({ countCode: 1 });
schema.index({ warehouseId: 1 });
schema.index({ status: 1 });

export const InventoryCount = model<IInventoryCount>('InventoryCount', schema);
export type { IInventoryCount, ICountItem };
