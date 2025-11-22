import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import {
  handleUploadTempFile,
  handleAnalyzeFile,
  handleFinalizePrintJob,
  handleDownloadPrintFile,
} from '../controllers/upload.controller';

const router = Router();

// POST /upload-temp-file
router.post(
  '/upload-temp-file',
  upload.single('file'),
  handleUploadError,
  handleUploadTempFile
);

// POST /analyze-file (updated to accept quality, material, purpose)
router.post('/analyze-file', handleAnalyzeFile);

// POST /finalize-print-job (updated to accept quality, material, purpose)
router.post('/finalize-print-job', handleFinalizePrintJob);

// GET /download-print-file/:jobId
router.get('/download-print-file/:jobId', handleDownloadPrintFile);

export default router;
