import { VercelRequest, VercelResponse } from '@vercel/node';

// Standalone API handler for Vercel Serverless Functions
// Note: This is a simplified handler. For full functionality, 
// deploy the server separately or use a different hosting approach.

export default async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return API info
  return res.status(200).json({
    message: 'ProtoLab API',
    version: '1.0.0',
    status: 'running',
    note: 'For full API functionality, the server needs to be deployed separately. Contact support for backend deployment instructions.'
  });
};
