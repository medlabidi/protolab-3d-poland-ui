import { Request, Response } from 'express';
import { uploadTempFile, downloadTempFile, moveFileToJob, deleteTempFile } from '../services/storage.service';
import { analyzeFile, estimatePrintJob, EstimationResult } from '../services/file-analysis.service';
import { getPrintParameters, MATERIAL_DENSITY } from '../config/print-parameters';
import { createPrintJob, updateJob } from '../services/print-job.service';
import { createUploadSession, updateUploadSession, bindSessionToUser, getUserSessions } from '../services/upload-session.service';
import { AuthRequest } from '../middleware/auth';

// POST /upload/create-session
export async function handleCreateSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = await createUploadSession(userId);

    res.status(201).json({
      success: true,
      sessionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /upload-temp-file
export async function handleUploadTempFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { file } = req;
    const { sessionId } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    // Get session
    const session = await updateUploadSession(sessionId, {
      filename: file.originalname,
      fileSize: file.size,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Upload to Supabase temp bucket
    const userId = req.user?.userId || sessionId;
    const { path, url } = await uploadTempFile(
      userId,
      file.originalname,
      file.buffer,
      file.mimetype
    );

    await updateUploadSession(sessionId, {
      filePath: path,
      status: 'temp',
    });

    res.status(200).json({
      success: true,
      sessionId,
      filePath: path,
      filename: file.originalname,
      fileSize: file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /analyze-file
export async function handleAnalyzeFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId, quality, material, purpose } = req.body;

    if (!sessionId || !quality || !material || !purpose) {
      res.status(400).json({
        error: 'sessionId, quality, material, and purpose are required',
      });
      return;
    }

    // Get session
    const session = await updateUploadSession(sessionId, {});
    if (!session || !session.filename) {
      res.status(404).json({ error: 'Session or file not found' });
      return;
    }

    const userId = req.user?.userId || sessionId;

    // Download temp file from Supabase
    const fileBuffer = await downloadTempFile(userId, session.filename);

    // Analyze
    const metadata = await analyzeFile(fileBuffer, session.filename);

    // Get parameters
    const parameters = getPrintParameters(quality as any, purpose as any);
    const materialDensity = MATERIAL_DENSITY[material as keyof typeof MATERIAL_DENSITY];
    const estimations = estimatePrintJob(metadata, parameters, material as any, materialDensity);

    // Update session
    await updateUploadSession(sessionId, {
      quality,
      material,
      purpose,
      metadata,
      estimations,
      status: 'analyzed',
    });

    const result: EstimationResult = {
      metadata,
      parameters,
      estimations,
    };

    res.status(200).json({
      success: true,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /finalize-print-job
export async function handleFinalizePrintJob(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    // Get session
    const session = await updateUploadSession(sessionId, {});
    if (!session || !session.filename) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Must be logged in to finalize job' });
      return;
    }

    // Create job
    const job = createPrintJob(userId, session.filename, session.fileSize || 0);

    // Move file
    await moveFileToJob(userId, session.filename, job.jobId);

    // Update session
    await updateUploadSession(sessionId, {
      status: 'submitted',
      userId,
    });

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      estimations: session.estimations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /upload-sessions
export async function handleGetUserSessions(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const sessions = await getUserSessions(req.user.userId);
    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /bind-session (after login, link anonymous session to user)
export async function handleBindSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;

    if (!sessionId || !req.user) {
      res.status(400).json({ error: 'sessionId and authentication required' });
      return;
    }

    const session = await bindSessionToUser(sessionId, req.user.userId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
