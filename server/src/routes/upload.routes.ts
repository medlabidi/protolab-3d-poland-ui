import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import {
  handleCreateSession,
  handleUploadTempFile,
  handleAnalyzeFile,
  handleFinalizePrintJob,
  handleGetUserSessions,
  handleBindSession,
} from '../controllers/upload.controller';

const router = Router();

// POST /upload/create-session (public, optional auth)
router.post('/create-session', optionalAuth, handleCreateSession);

// POST /upload-temp-file (public, optional auth)
router.post(
  '/upload-temp-file',
  optionalAuth,
  upload.single('file'),
  handleUploadError,
  handleUploadTempFile
);

// POST /analyze-file (public, optional auth)
router.post('/analyze-file', optionalAuth, handleAnalyzeFile);

// POST /finalize-print-job (requires auth)
router.post('/finalize-print-job', authenticateToken, handleFinalizePrintJob);

// GET /upload-sessions (requires auth)
router.get('/sessions', authenticateToken, handleGetUserSessions);

// POST /bind-session (requires auth)
router.post('/bind-session', authenticateToken, handleBindSession);

export default router;
