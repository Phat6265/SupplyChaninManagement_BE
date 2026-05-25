import { Schema, model, Types } from 'mongoose';

interface IShipment {
  shipmentCode: string;
  originWarehouseId: string;
  destinationWarehouseId?: string;
  salesOrderId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  driverId?: string;
  latitude?: number;
  longitude?: number;
  eta?: Date;
  items: Array<{ productId: string; quantity: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IShipment>(
  {
    shipmentCode: { type: String, required: true, unique: true, trim: true },
    originWarehouseId: { type: String, required: true, index: true },
    destinationWarehouseId: { type: String, index: true },
    salesOrderId: { type: Schema.Types.ObjectId, index: true },
    customerId: { type: Schema.Types.ObjectId, index: true },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    driverId: String,
    latitude: Number,
    longitude: Number,
    eta: Date,
    items: [{ productId: String, quantity: Number }],
  },
  { timestamps: true }
);

schema.index({ shipmentCode: 1 });
schema.index({ status: 1 });
schema.index({ status: 1, driverId: 1 });
schema.index({ status: 1, createdAt: -1 });

export const Shipment = model<IShipment>('Shipment', schema);
export type { IShipment };
