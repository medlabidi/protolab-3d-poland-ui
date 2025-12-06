import { VercelRequest, VercelResponse } from '@vercel/node';

// Use require for compiled JavaScript from server/dist
const createApp = require('../server/dist/express-app').default;

// Create Express app instance
const app = createApp();

// Export handler for Vercel serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  // Let Express handle the request
  return app(req, res);
};
