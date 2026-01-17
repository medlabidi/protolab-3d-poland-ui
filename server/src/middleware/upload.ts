import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { isValidFileExtension } from '../utils/validators';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use disk storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!isValidFileExtension(file.originalname)) {
    cb(new Error('Invalid file type. Only STL, OBJ, and 3MF files are allowed.'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

export const handleUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size exceeds 200MB limit' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  next();
};