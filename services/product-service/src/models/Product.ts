import { Schema, model } from 'mongoose';

interface IProduct {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  description?: string;
  price?: number;
  unit?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    description: String,
    price: Number,
    unit: String,
    imageUrl: String,
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ name: 'text' });

export const Product = model<IProduct>('Product', productSchema);
export type { IProduct };
