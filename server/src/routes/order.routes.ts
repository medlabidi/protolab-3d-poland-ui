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
router.patch('/:id/review', validate(addReviewSchema), orderController.addReview);

export default router;
