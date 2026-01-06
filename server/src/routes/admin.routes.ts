import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { userController } from '../controllers/user.controller';
import { adminConversationsController } from '../controllers/admin-conversations.controller';
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

// Order management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/type/:type', adminController.getOrdersByType);
router.get('/orders/:id', adminController.getOrderById);
router.post('/orders/:designOrderId/create-print', adminController.createPrintFromDesign);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.patch('/orders/:id/pricing', validate(updateOrderPricingSchema), adminController.updateOrderPricing);
router.patch('/orders/:id/tracking', validate(updateOrderTrackingSchema), adminController.updateOrderTracking);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/all', (req, res) => userController.getAllUsers(req, res));
router.delete('/users/:id', (req, res) => userController.deleteUser(req, res));

// Settings management
router.get('/settings', adminController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), adminController.updateSettings);

// Conversation management
router.get('/conversations', adminConversationsController.getAllConversations);
router.get('/conversations/:conversationId', adminConversationsController.getConversation);
router.get('/conversations/:conversationId/messages', adminConversationsController.getConversationMessages);
router.post('/conversations/:conversationId/messages', adminConversationsController.sendConversationMessage);
router.patch('/conversations/:conversationId/status', adminConversationsController.updateConversationStatus);
router.post('/conversations/:conversationId/read', adminConversationsController.markConversationAsRead);

export default router;