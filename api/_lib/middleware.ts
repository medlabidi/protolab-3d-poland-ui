import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends VercelRequest {
  user?: JWTPayload;
}

export const cors = (req: VercelRequest, res: VercelResponse) => {
  const origin = req.headers.origin || '';
  
  // Allow production and local development origins
  const allowedOrigins = [
    'https://protolab.info',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
};

export const authenticate = (req: AuthenticatedRequest): JWTPayload | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    return null;
  }
};

export const requireAuth = (req: AuthenticatedRequest, res: VercelResponse): JWTPayload | null => {
  const user = authenticate(req);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  
  return user;
};
