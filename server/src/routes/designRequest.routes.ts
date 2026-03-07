import { Router } from 'express';
import { designRequestController } from '../controllers/designRequest.controller';
import { authenticate } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create design request with file uploads
router.post(
  '/',
  upload.array('referenceFiles', 10),
  handleUploadError,
  designRequestController.createDesignRequest
);

router.get('/my', designRequestController.getMyDesignRequests);
router.get('/:id', designRequestController.getDesignRequestById);

// Approve or reject design
router.post('/:id/approve', designRequestController.approveDesign);
router.post('/:id/reject', designRequestController.rejectDesign);

export default router;
