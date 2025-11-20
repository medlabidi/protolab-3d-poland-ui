import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 
  | 'submitted' 
  | 'in_queue' 
  | 'printing' 
  | 'finished' 
  | 'delivered';

export type ShippingMethod = 'pickup' | 'inpost' | 'courier';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  status: OrderStatus;
  materialWeight?: number;
  printTime?: number;
  price: number;
  shippingMethod: ShippingMethod;
  review?: string;
  trackingCode?: string;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  layerHeight: {
    type: Number,
    required: true,
  },
  infill: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['submitted', 'in_queue', 'printing', 'finished', 'delivered'],
    default: 'submitted',
  },
  materialWeight: {
    type: Number,
    min: 0,
  },
  printTime: {
    type: Number,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  shippingMethod: {
    type: String,
    enum: ['pickup', 'inpost', 'courier'],
    required: true,
  },
  review: {
    type: String,
  },
  trackingCode: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);