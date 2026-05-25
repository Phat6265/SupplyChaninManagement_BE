import { Schema, model } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  STAFF = 'staff',
  DRIVER = 'driver',
}

interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  warehouseId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STAFF,
    },
    warehouseId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);
export type { IUser };
