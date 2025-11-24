import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orderController } from '../../server/src/controllers/order.controller';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get user's orders
        await orderController.getMyOrders(req as any, res as any, () => {});
        break;
      
      case 'POST':
        // Create new order
        await orderController.createOrder(req as any, res as any, () => {});
        break;
      
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Orders API error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
