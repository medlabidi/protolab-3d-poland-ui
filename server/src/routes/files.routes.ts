import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { filesController } from '../controllers/files.controller';

const router = Router();

// Get signed URL for S3 file access
router.get('/signed-url', authenticate, filesController.getSignedUrl);

export default router;
