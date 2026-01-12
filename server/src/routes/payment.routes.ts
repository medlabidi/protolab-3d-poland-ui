import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createBlikPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    blikCode: z
      .string()
      .length(6, 'BLIK code must be 6 digits')
      .regex(/^\d{6}$/, 'BLIK code must contain only digits'),
  }),
});

const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

// Protected routes (require authentication)
router.post(
  '/blik',
  authenticate,
  validate(createBlikPaymentSchema),
  paymentController.createBlikPayment
);

router.post(
  '/create',
  authenticate,
  validate(createPaymentSchema),
  paymentController.createPayment
);

router.get(
  '/status/:orderId',
  authenticate,
  paymentController.getPaymentStatus
);

// Public route for PayU notifications (webhook)
router.post('/payu/notify', paymentController.handleNotification);

export default router;
