import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type OrderStatus = 
  | 'submitted' 
  | 'in_queue' 
  | 'printing' 
  | 'finished' 
  | 'delivered';

export type ShippingMethod = 'pickup' | 'inpost' | 'courier';

export interface PricingParams {
  materialWeight?: number;
  printTime?: number;
  materialRate: number;
  timeRate: number;
  serviceFee: number;
}

export interface OrderCreateInput {
  fileName: string;
  fileUrl: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  shippingMethod: ShippingMethod;
}
