import { Schema, model, Types } from 'mongoose';

export enum RequisitionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted', // converted to PO
}

interface IReqItem {
  productId: Types.ObjectId;
  quantity: number;
  estimatedUnitPrice?: number;
  notes?: string;
}

export interface IPurchaseRequisition {
  reqNumber: string;
  title: string;
  status: RequisitionStatus;
  items: IReqItem[];
  totalEstimatedAmount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
  purchaseOrderId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IReqItem>({
  productId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  estimatedUnitPrice: { type: Number, min: 0 },
  notes: String,
});

const schema = new Schema<IPurchaseRequisition>(
  {
    reqNumber: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(RequisitionStatus), default: RequisitionStatus.DRAFT },
    items: [itemSchema],
    totalEstimatedAmount: { type: Number, default: 0, min: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    requestedBy: { type: String, required: true },
    approvedBy: String,
    rejectedBy: String,
    rejectionReason: String,
    notes: String,
    purchaseOrderId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

schema.index({ reqNumber: 1 });
schema.index({ status: 1 });
schema.index({ requestedBy: 1 });

export const PurchaseRequisition = model<IPurchaseRequisition>('PurchaseRequisition', schema);
