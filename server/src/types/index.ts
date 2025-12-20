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
  | 'delivered'
  | 'on_hold'
  | 'suspended';

export type ShippingMethod = 'pickup' | 'inpost' | 'courier';

export interface PricingParams {
  materialWeight: number;
  printTime: number;
  materialType: string;
  color: string;
  quality: string;
  purpose: string;
}

export interface PricingBreakdown {
  materialCost: number;
  colorSurcharge: number;
  laborCost: number;
  serviceFee: number;
  subtotal: number;
  markup: number;
  total: number;
}

export interface OrderCreateInput {
  fileName: string;
  fileUrl: string;
  filePath?: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  shippingMethod: ShippingMethod;
  shippingAddress?: string;
  price?: number;
  projectName?: string;
  materialWeight?: number;  // Weight in grams
  printTime?: number;       // Print time in minutes
  modelVolume?: number;     // Base model volume in cm³ (for exact recalculation)
}

// Re-export pricing types for backward compatibility
export type { PricingResult } from './pricing';
