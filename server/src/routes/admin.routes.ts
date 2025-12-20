import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { adminBusinessController } from '../controllers/admin-business.controller';
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
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.patch('/orders/:id/pricing', validate(updateOrderPricingSchema), adminController.updateOrderPricing);
router.patch('/orders/:id/tracking', validate(updateOrderTrackingSchema), adminController.updateOrderTracking);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/role', adminController.updateUserRole);
router.put('/users/:userId', adminBusinessController.updateBusiness);

// Business management routes
router.get('/businesses', adminBusinessController.getBusinesses);
router.get('/businesses/:userId/invoices', adminBusinessController.getBusinessInvoices);

router.get('/settings', adminController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), adminController.updateSettings);

// Conversations and Support
router.get('/conversations', adminController.getAllConversations);
router.get('/conversations/:conversationId/messages', adminController.getConversationMessages);
router.post('/conversations/:conversationId/messages', adminController.sendMessageToUser);
router.patch('/conversations/:conversationId/status', adminController.updateConversationStatus);
router.patch('/conversations/:conversationId/read', adminController.markConversationMessagesAsRead);

// Materials routes
router.get('/materials', adminController.getAllMaterials);
router.get('/materials/:id', adminController.getMaterialById);
router.post('/materials', adminController.createMaterial);
router.patch('/materials/:id', adminController.updateMaterial);
router.delete('/materials/:id', adminController.deleteMaterial);

// Printers routes
router.get('/printers', adminController.getAllPrinters);
router.get('/printers/:id', adminController.getPrinterById);
router.post('/printers', adminController.createPrinter);
router.patch('/printers/:id', adminController.updatePrinter);
router.patch('/printers/:id/set-default', adminController.setDefaultPrinter);
router.delete('/printers/:id', adminController.deletePrinter);

export default router;