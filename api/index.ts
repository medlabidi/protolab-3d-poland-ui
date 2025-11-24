import { VercelRequest, VercelResponse } from '@vercel/node';
import createApp from '../server/src/express-app';

// Create Express app instance
const app = createApp();

// Export handler for Vercel serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  // Let Express handle the request
  return app(req, res);
};
