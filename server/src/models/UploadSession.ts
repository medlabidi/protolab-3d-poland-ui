import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadSession extends Document {
  sessionId: string;
  userId?: string; // null if not logged in
  filename: string;
  fileSize: number;
  filePath: string;
  quality?: string;
  material?: string;
  purpose?: string;
  metadata?: any;
  estimations?: any;
  status: 'temp' | 'analyzed' | 'submitted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSessionSchema = new Schema<IUploadSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      default: null,
    },
    filename: String,
    fileSize: Number,
    filePath: String,
    quality: String,
    material: String,
    purpose: String,
    metadata: Schema.Types.Mixed,
    estimations: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['temp', 'analyzed', 'submitted', 'expired'],
      default: 'temp',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export const UploadSession = mongoose.model<IUploadSession>('UploadSession', uploadSessionSchema);
