import { Schema, model } from 'mongoose';

interface IWarehouse {
  name: string;
  location: string;
  address?: string;
  capacity: number;
  currentStock?: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String, required: true, trim: true },
    address: String,
    capacity: { type: Number, required: true, default: 0 },
    currentStock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.index({ name: 1 });

export const Warehouse = model<IWarehouse>('Warehouse', schema);
export type { IWarehouse };
