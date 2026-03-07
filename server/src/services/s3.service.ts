import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${uuidv4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    
    await s3Client.send(command);
    
    return key;
  }

  /**
   * Upload 3D design file to S3 (for admin design assistance)
   */
  async upload3DDesignFile(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, '3d-designs');
  }
  
  /**
   * Get a signed URL for file access (expires in 1 hour by default)
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Get a long-lived signed URL for 3D viewer (expires in 7 days)
   */
  async get3DFileUrl(key: string): Promise<string> {
    return this.getFileUrl(key, 7 * 24 * 60 * 60); // 7 days
  }
  
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  }
}

export const s3Service = new S3Service();
