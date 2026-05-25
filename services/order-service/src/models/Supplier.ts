import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  rating: number;
  address: { street: string; city: string; state: string; zipCode: string; country: string };
  isActive: boolean;
}

const schema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    taxId: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.index({ email: 1 });
schema.index({ name: 'text' });

export const Supplier = model<ISupplier>('Supplier', schema);
