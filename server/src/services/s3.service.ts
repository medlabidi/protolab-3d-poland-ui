import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `uploads/${Date.now()}-${uuidv4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    
    await s3Client.send(command);
    
    return key;
  }
  
  async getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
