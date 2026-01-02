import { VercelRequest, VercelResponse } from '@vercel/node';

// Store payment HTML content temporarily (in production, use Redis or database)
const paymentSessions = new Map<string, string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'POST') {
    // Store PayU HTML content
    const { sessionId, htmlContent } = req.body;
    
    if (!sessionId || !htmlContent) {
      return res.status(400).json({ error: 'Missing sessionId or htmlContent' });
    }

    // Store the HTML content with expiry (1 hour)
    paymentSessions.set(sessionId, htmlContent);
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
      paymentSessions.delete(sessionId);
    }, 60 * 60 * 1000);

    return res.status(200).json({ success: true });
  }

  if (method === 'GET') {
    // Serve PayU HTML content
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).send('Missing or invalid sessionId');
    }

    const htmlContent = paymentSessions.get(sessionId);
    
    if (!htmlContent) {
      return res.status(404).send('Payment session not found or expired');
    }

    // Serve the HTML content directly
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}