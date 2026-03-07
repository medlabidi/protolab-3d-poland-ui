import { Request, Response, NextFunction } from 'express';
import { s3Service } from '../services/s3.service';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class FilesController {
  /**
   * Get a signed URL for accessing S3 file
   */
  async getSignedUrl(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileUrl } = req.query;

      if (!fileUrl || typeof fileUrl !== 'string') {
        res.status(400).json({ error: 'File URL is required' });
        return;
      }

      // Check if it's an S3 URL
      if (!fileUrl.startsWith('s3://')) {
        // Return the original URL if it's not an S3 URL
        res.json({ signedUrl: fileUrl });
        return;
      }

      // Extract S3 key from s3:// URL
      const s3Key = fileUrl.replace('s3://', '');

      // Generate signed URL
      const signedUrl = await s3Service.get3DFileUrl(s3Key);

      logger.info({ s3Key, userId: req.user?.id }, 'Generated signed URL for file access');

      res.json({ signedUrl });
    } catch (error) {
      logger.error({ error, fileUrl: req.query.fileUrl }, 'Failed to generate signed URL');
      next(error);
    }
  }
}

export const filesController = new FilesController();
