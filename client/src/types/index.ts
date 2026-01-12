import { Request } from 'express';

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

export type OrderType = 'print' | 'design';

export type DesignStatus = 
  | 'pending'
  | 'in_review'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type UsageType = 
  | 'mechanical'
  | 'decorative'
  | 'functional'
  | 'prototype'
  | 'other';

export type ShippingMethod = 'pickup' | 'inpost' | 'courier' | 'dpd';

export interface PricingParams {
  materialWeight?: number;
  printTime?: number;
  materialRate: number;
  timeRate: number;
  serviceFee: number;
}

// Print Job Input
export interface PrintJobCreateInput {
  fileName: string;
  fileUrl: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  shippingMethod: ShippingMethod;
  shippingAddress?: string;
  price?: number;
  projectName?: string;
  materialWeight?: number;
  printTime?: number;
}

// Design Request Input
export interface DesignRequestCreateInput {
  projectName: string;
  ideaDescription: string;
  usageType?: UsageType;
  usageDetails?: string;
  approximateDimensions?: string;
  desiredMaterial?: string;
  attachedFiles?: string[];
  referenceImages?: string[];
  requestChat?: boolean;
}

// Legacy unified order input (backward compatibility)
export interface OrderCreateInput {
  fileName: string;
  fileUrl: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  shippingMethod: ShippingMethod;
  orderType?: OrderType;
  price?: number;
  projectName?: string;
  shippingAddress?: string;
  
  // Design fields
  ideaDescription?: string;
  usageType?: UsageType;
  usageDetails?: string;
  approximateDimensions?: string;
  desiredMaterial?: string;
  attachedFiles?: string[];
  referenceImages?: string[];
  requestChat?: boolean;
  
  // Print configuration fields from mahmoud
  supportType?: 'none' | 'normal' | 'tree';
  infillPattern?: 'grid' | 'honeycomb' | 'triangles' | 'gyroid';
  customLayerHeight?: number;
  customInfill?: number;
}
