import { v4 as uuidv4 } from 'uuid';
import { UploadSession, IUploadSession } from '../models/UploadSession';

// Create upload session
export async function createUploadSession(userId?: string): Promise<string> {
  const sessionId = uuidv4();
  const session = new UploadSession({
    sessionId,
    userId: userId || null,
    status: 'temp',
  });

  await session.save();
  return sessionId;
}

// Get upload session
export async function getUploadSession(sessionId: string): Promise<IUploadSession | null> {
  return await UploadSession.findOne({ sessionId });
}

// Update upload session
export async function updateUploadSession(
  sessionId: string,
  updates: Partial<IUploadSession>
): Promise<IUploadSession | null> {
  return await UploadSession.findOneAndUpdate({ sessionId }, updates, { new: true });
}

// Bind session to user (after login)
export async function bindSessionToUser(sessionId: string, userId: string): Promise<IUploadSession | null> {
  return await UploadSession.findOneAndUpdate(
    { sessionId },
    { userId },
    { new: true }
  );
}

// Get user's sessions
export async function getUserSessions(userId: string): Promise<IUploadSession[]> {
  return await UploadSession.find({ userId, status: { $ne: 'expired' } }).sort({ createdAt: -1 });
}
