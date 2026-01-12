import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload, handleUploadError } from '../middleware/upload';
import { createOrderSchema, addReviewSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  upload.single('file'),
  handleUploadError,
  validate(createOrderSchema),
  orderController.createOrder
);

router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/file', orderController.getOrderFile);
router.patch('/:id', orderController.updateOrder);
router.patch('/:id/review', validate(addReviewSchema), orderController.addReview);
router.delete('/:id', orderController.cancelOrder);

// Archive, restore, and delete operations
router.patch('/:id/archive', orderController.archiveOrder);
router.patch('/:id/restore', orderController.restoreOrder);
router.delete('/:id/soft', orderController.softDeleteOrder);
router.delete('/:id/permanent', orderController.permanentDeleteOrder);

// Refund endpoint
router.post('/:id/refund', orderController.submitRefundRequest);

// Email notification endpoints
router.post('/email/payment-confirmation', orderController.sendPaymentConfirmationEmail);
router.post('/email/refund-request', orderController.sendRefundRequestEmail);
router.post('/email/invoice', orderController.sendInvoiceEmail);

export default router;
