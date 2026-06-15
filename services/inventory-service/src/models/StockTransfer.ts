import { Schema, model } from 'mongoose';

interface IStockTransferItem {
  productId: string;
  quantity: number;
}

interface IStockTransfer {
  transferCode: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  items: IStockTransferItem[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockTransferItemSchema = new Schema<IStockTransferItem>(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const schema = new Schema<IStockTransfer>(
  {
    transferCode: { type: String, required: true, unique: true, trim: true },
    sourceWarehouseId: { type: String, required: true },
    destinationWarehouseId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'in_transit', 'completed', 'cancelled'],
      default: 'pending',
    },
    items: { type: [stockTransferItemSchema], required: true },
    notes: String,
    createdBy: { type: String, required: true },
    approvedBy: String,
    completedAt: Date,
  },
  { timestamps: true }
);

schema.index({ transferCode: 1 });
schema.index({ status: 1 });
schema.index({ sourceWarehouseId: 1 });
schema.index({ destinationWarehouseId: 1 });

export const StockTransfer = model<IStockTransfer>('StockTransfer', schema);
export type { IStockTransfer, IStockTransferItem };
