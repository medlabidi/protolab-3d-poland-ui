import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const createOrderSchema = z.object({
  material: z.string().min(1),
  color: z.string().min(1),
  layerHeight: z.number().positive(),
  infill: z.number().min(0).max(100),
  quantity: z.number().int().positive(),
  shippingMethod: z.enum(['pickup', 'inpost', 'courier']),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['submitted', 'in_queue', 'printing', 'finished', 'delivered']),
});

export const updateOrderPricingSchema = z.object({
  materialWeight: z.number().positive().optional(),
  printTime: z.number().positive().optional(),
});

export const updateOrderTrackingSchema = z.object({
  trackingCode: z.string().min(1),
});

export const addReviewSchema = z.object({
  review: z.string().min(1).max(1000),
});

export const updateSettingsSchema = z.object({
  materialRate: z.number().positive().optional(),
  timeRate: z.number().positive().optional(),
  serviceFee: z.number().nonnegative().optional(),
});

export const allowedFileTypes = [
  'model/stl',
  'application/sla',
  'application/vnd.ms-pki.stl',
  'model/obj',
  'application/x-tgif',
  'application/step',
  'application/stp',
];

export const isValidFileType = (mimetype: string): boolean => {
  return allowedFileTypes.includes(mimetype) || 
    mimetype === 'application/octet-stream';
};

export const isValidFileExtension = (filename: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  return ['stl', 'obj', 'step', 'stp'].includes(ext || '');
};