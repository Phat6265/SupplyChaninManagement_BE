import { Schema, model } from 'mongoose';

interface ICategory {
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: String,
    parentId: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text' });

export const Category = model<ICategory>('Category', categorySchema);
export type { ICategory };
