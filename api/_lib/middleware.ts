import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends VercelRequest {
  user?: JWTPayload;
}

// ==================== CORS ====================
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

// ==================== AUTHENTICATION ====================
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

// ==================== ADMIN AUTHORIZATION ====================
/**
 * Requires user to be authenticated AND have admin role
 * Returns null and sends 403 if not admin
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: VercelResponse,
  supabase: any
): Promise<JWTPayload | null> => {
  const user = requireAuth(req, res);
  if (!user) return null;
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (error || userData?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  
  return user;
};

// ==================== URL/PATH UTILITIES ====================
/**
 * Extracts parameter from URL path
 * Examples:
 * - path: "/admin/orders/123", index: 2 → "123"
 * - path: "/admin/orders/123/status", index: 2 → "123"
 */
export const extractPathParam = (req: VercelRequest, index: number): string | null => {
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const parts = path.split('/').filter(Boolean);
  return parts[index] || null;
};

/**
 * Extracts query parameter with fallback to body
 */
export const getParam = (req: AuthenticatedRequest, param: string): any => {
  // Check query params first
  if (req.query && req.query[param]) {
    return req.query[param];
  }
  // Then check body
  if (req.body && req.body[param]) {
    return req.body[param];
  }
  return null;
};
