import { S3Client } from '@aws-sdk/client-s3';

const s3Config = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
};

export const s3Client = new S3Client(s3Config);
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'protolab-files';