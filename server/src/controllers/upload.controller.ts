import { Request, Response } from 'express';
import { uploadTempFile, downloadTempFile, moveFileToJob } from '../services/storage.service';
import { analyzeFile, estimatePrintJob, EstimationResult } from '../services/file-analysis.service';
import { getPrintParameters, MATERIAL_DENSITY } from '../config/print-parameters';
import { pricingService } from '../services/pricing.service';
import { createPrintJob, updateJob } from '../services/print-job.service';
import { getColorPrice } from '../config/material-colors';

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

    if (!MATERIAL_DENSITY[material as keyof typeof MATERIAL_DENSITY]) {
      res.status(400).json({ error: `Invalid material. Supported: ${Object.keys(MATERIAL_DENSITY).join(', ')}` });
      return;
    }

    // Validate color
    try {
      getColorPrice(material, color);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }

    // Download temp file
    const fileBuffer = await downloadTempFile(sessionId, filename);

    // Analyze geometry
    const metadata = await analyzeFile(fileBuffer, filename);

    // Get print parameters
    const parameters = getPrintParameters(quality as any, purpose as any);

    // Estimate print job (use color's density)
    const colorInfo = getColorPrice(material, color);
    const estimations = estimatePrintJob(
      metadata,
      parameters,
      material as any,
      colorInfo.density
    );

    // Calculate pricing
    const pricing = pricingService.calculatePrice({
      materialWeight: estimations.material_weight_g,
      printTime: estimations.print_time_minutes,
      materialType: material,
      color,
      quality,
      purpose,
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
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /finalize-print-job
export async function handleFinalizePrintJob(req: Request, res: Response): Promise<void> {
  try {
    const { filename, sessionId, quality, material, color, purpose, metadata } = req.body;

    if (!filename || !sessionId || !quality || !material || !color || !purpose) {
      res.status(400).json({
        error: 'filename, sessionId, quality, material, color, purpose required',
      });
      return;
    }

    // Validate color
    try {
      getColorPrice(material, color);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
      return;
    }

    const userId = (req as any).user?.id || 'anonymous';

    // Create job record
    const job = createPrintJob(userId, filename, metadata?.fileSize || 0);

    // Move file
    await moveFileToJob(sessionId, filename, job.jobId);

    // Get parameters and estimations
    const parameters = getPrintParameters(quality as any, purpose as any);
    const colorInfo = getColorPrice(material, color);
    const estimations = estimatePrintJob(
      metadata,
      parameters,
      material as any,
      colorInfo.density
    );

    // Calculate pricing
    const pricing = pricingService.calculatePrice({
      materialWeight: estimations.material_weight_g,
      printTime: estimations.print_time_minutes,
      materialType: material,
      color,
      quality,
      purpose,
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
