import type { VercelRequest, VercelResponse } from '@vercel/node';
import { paymentController } from '../../server/src/controllers/payment.controller';

// Extend VercelRequest to include params for Express compatibility
interface RequestWithParams extends VercelRequest {
  params?: Record<string, string>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Handle different HTTP methods and paths
    const { method } = req;
    const path = req.url?.split('/').pop() || '';

    if (path === 'notify' && method === 'POST') {
      // Handle PayU notification webhook
      await paymentController.handleNotification(req as any, res as any, () => {});
      return;
    }

    switch (method) {
      case 'POST':
        if (path === 'blik') {
          // Create BLIK payment
          await paymentController.createBlikPayment(req as any, res as any, () => {});
        } else if (path === 'create') {
          // Create standard payment
          await paymentController.createPayment(req as any, res as any, () => {});
        } else {
          res.status(404).json({ error: 'Endpoint not found' });
        }
        break;

      case 'GET':
        // Get payment status
        const orderId = req.query.orderId as string;
        if (orderId) {
          const reqWithParams = req as RequestWithParams;
          reqWithParams.params = { orderId };
          await paymentController.getPaymentStatus(reqWithParams as any, res as any, () => {});
        } else {
          res.status(400).json({ error: 'Order ID required' });
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Payment API error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
