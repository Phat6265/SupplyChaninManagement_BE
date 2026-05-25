import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  taxId?: string;
  address: { street: string; city: string; state: string; zipCode: string; country: string };
  isActive: boolean;
}

const schema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    taxId: { type: String, trim: true },
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
schema.index({ name: 'text', companyName: 'text' });

export const Customer = model<ICustomer>('Customer', schema);
