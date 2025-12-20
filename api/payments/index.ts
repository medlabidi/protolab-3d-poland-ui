import type { VercelRequest, VercelResponse } from '@vercel/node';

// This endpoint is not implemented in serverless functions
// Payment handling is done through the main api/index.ts
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(501).json({ 
    error: 'Not implemented',
    message: 'Payment endpoints are handled through /api/orders. This standalone endpoint is not available.'
  });
}
