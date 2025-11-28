import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createOrderSchema = z.object({
  material: z.string().min(1),
  color: z.string().min(1),
  layerHeight: z.string().transform(val => parseFloat(val)),
  infill: z.string().transform(val => parseInt(val)),
  quantity: z.string().transform(val => parseInt(val)),
  shippingMethod: z.enum(['pickup', 'inpost', 'dpd', 'courier']),
  shippingAddress: z.string().optional(),
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

/**
 * Validate file extension against allowed 3D file types
 */
export function isValidFileExtension(filename: string): boolean {
  const allowedExtensions = ['.stl', '.obj', '.3mf'];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}