import { Schema, model, Types } from 'mongoose';

interface IProductVariant {
  productId: Types.ObjectId;
  variantName: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>; // e.g. { color: 'Red', size: 'XL' }
  price?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, trim: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    price: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.index({ productId: 1 });
schema.index({ sku: 1 });

export const ProductVariant = model<IProductVariant>('ProductVariant', schema);
export type { IProductVariant };
