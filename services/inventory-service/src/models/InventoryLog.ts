import { Schema, model } from 'mongoose';

interface IInventoryLog {
  productId: string;
  warehouseId: string;
  actionType: 'import' | 'export' | 'adjustment' | 'transfer';
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  batchNumber?: string;
  expirationDate?: Date;
  createdBy: string;
  notes?: string;
  createdAt: Date;
}

const schema = new Schema<IInventoryLog>(
  {
    productId: { type: String, required: true, index: true },
    warehouseId: { type: String, required: true, index: true },
    actionType: {
      type: String,
      enum: ['import', 'export', 'adjustment', 'transfer'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: Number,
    newQuantity: Number,
    batchNumber: String,
    expirationDate: Date,
    createdBy: String,
    notes: String,
  },
  { timestamps: true }
);

schema.index({ productId: 1, warehouseId: 1 });
schema.index({ createdAt: -1 });

export const InventoryLog = model<IInventoryLog>('InventoryLog', schema);
export type { IInventoryLog };
