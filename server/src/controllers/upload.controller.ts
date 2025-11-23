import { Request, Response } from 'express';
import {
  uploadTempFile,
  downloadTempFile,
  moveFileToJob,
} from '../services/storage.service';
import {
  analyzeFile,
  estimatePrintJob,
  EstimationResult,
} from '../services/file-analysis.service';
import { fileValidationService } from '../services/file-validation.service';
import { getPrintParameters, MATERIAL_DENSITY } from '../config/print-parameters';
import { pricingService } from '../services/pricing.service';
import { createPrintJob, updateJob } from '../services/print-job.service';

// POST /upload-temp-file
export async function handleUploadTempFile(req: Request, res: Response): Promise<void> {
  try {
    const { file } = req;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = (req as any).user?.id || 'anonymous';
    const sessionId = userId; // Use userId as sessionId

    // Upload to temp-files bucket
    const { path, url } = await uploadTempFile(
      sessionId,
      file.originalname,
      file.buffer,
      file.mimetype
    );

    res.status(200).json({
      success: true,
      filePath: path,
      filename: file.originalname,
      fileSize: file.size,
      sessionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /analyze-file
export async function handleAnalyzeFile(req: Request, res: Response): Promise<void> {
  try {
    const { filename, sessionId, quality, material, color, purpose } = req.body;

    if (!filename || !sessionId || !quality || !material || !color || !purpose) {
      res.status(400).json({
        error: 'filename, sessionId, quality, material, color, and purpose are required',
      });
      return;
    }

    // Validate inputs
    if (!['draft', 'standard', 'high'].includes(quality)) {
      res.status(400).json({ error: 'Invalid quality (draft, standard, high)' });
      return;
    }

    if (!['prototype', 'functional', 'aesthetic'].includes(purpose)) {
      res.status(400).json({ error: 'Invalid purpose (prototype, functional, aesthetic)' });
      return;
    }

    // Download temp file
    const fileBuffer = await downloadTempFile(sessionId, filename);

    // Analyze geometry
    const metadata = await analyzeFile(fileBuffer, filename);

    // VALIDATE FILE HEALTH
    const validation = fileValidationService.validateFile(metadata);

    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'File validation failed',
        details: {
          errors: validation.errors,
          warnings: validation.warnings,
          message: fileValidationService.getErrorMessage(validation),
        },
      });
      return;
    }

    // File is valid, continue with estimation
    const parameters = getPrintParameters(quality as any, purpose as any);

    const colorInfo = MATERIAL_DENSITY[material as keyof typeof MATERIAL_DENSITY];
    const estimations = estimatePrintJob(
      metadata,
      parameters,
      material as any,
      colorInfo || 1.24
    );

    // Calculate price using pricing service
    const pricing = pricingService.calculatePrice({
      materialType: material,
      color,
      materialWeightGrams: estimations.material_weight_g,
      printTimeHours: estimations.print_time_minutes / 60,
      laborTimeMinutes: 20, // Default 20 minutes
      deliveryFee: 0,
    });

    const result: EstimationResult = {
      metadata,
      parameters,
      estimations,
    };

    res.status(200).json({
      success: true,
      result,
      pricing,
      validation: {
        isValid: true,
        warnings: validation.warnings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /finalize-print-job
export async function handleFinalizePrintJob(req: Request, res: Response): Promise<void> {
  try {
    const { filename, sessionId, quality, material, color, purpose, metadata, deliveryFee } =
      req.body;

    if (!filename || !sessionId || !quality || !material || !color || !purpose) {
      res.status(400).json({
        error: 'filename, sessionId, quality, material, color, purpose required',
      });
      return;
    }

    // Validate file one more time before finalizing
    const validation = fileValidationService.validateFile(metadata);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'File validation failed during finalization',
        details: validation.errors,
      });
      return;
    }

    const userId = (req as any).user?.id || 'anonymous';

    // Create job record
    const job = createPrintJob(userId, filename, metadata?.fileSize || 0);

    // Move file
    await moveFileToJob(sessionId, filename, job.jobId);

    // Get parameters and estimations
    const parameters = getPrintParameters(quality as any, purpose as any);
    const colorInfo = MATERIAL_DENSITY[material as keyof typeof MATERIAL_DENSITY];
    const estimations = estimatePrintJob(
      metadata,
      parameters,
      material as any,
      colorInfo || 1.24
    );

    // Calculate price
    const pricing = pricingService.calculatePrice({
      materialType: material,
      color,
      materialWeightGrams: estimations.material_weight_g,
      printTimeHours: estimations.print_time_minutes / 60,
      laborTimeMinutes: 20,
      deliveryFee: deliveryFee || 0,
    });

    // Update job
    updateJob(job.jobId, {
      status: 'processing',
      metadata: {
        ...metadata,
        parameters,
        estimations,
        pricing,
        quality,
        material,
        color,
        purpose,
      },
    });

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      estimations,
      pricing,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /download-print-file/:jobId
export async function handleDownloadPrintFile(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      res.status(400).json({ error: 'jobId required' });
      return;
    }

    // In production, verify user has access to this job
    // For now, backend-only (no direct user access)

    res.status(200).json({
      success: true,
      message: 'Use Supabase signed URL for secure file download (backend only)',
      jobId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
