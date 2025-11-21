import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import {
  updateOrderStatusSchema,
  updateOrderPricingSchema,
  updateOrderTrackingSchema,
  updateSettingsSchema,
} from '../utils/validators';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.patch('/orders/:id/pricing', validate(updateOrderPricingSchema), adminController.updateOrderPricing);
router.patch('/orders/:id/tracking', validate(updateOrderTrackingSchema), adminController.updateOrderTracking);

router.get('/settings', adminController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), adminController.updateSettings);

export default router;