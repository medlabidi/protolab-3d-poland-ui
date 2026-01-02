import { Router, Request, Response } from 'express';
import { shippingService } from '../services/shipping.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/admin/shipping/generate-label
 * Generate shipping label for InPost or DPD
 */
router.post('/generate-label', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is attached by authenticate middleware
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { orderId, shippingMethod, address } = req.body;

    if (!orderId || !shippingMethod) {
      return res.status(400).json({ error: 'Order ID and shipping method are required' });
    }

    if (shippingMethod === 'pickup') {
      return res.status(400).json({ error: 'Pickup orders do not require shipping labels' });
    }

    const label = await shippingService.generateLabel(orderId, shippingMethod, address);

    res.json({
      success: true,
      trackingCode: label.trackingCode,
      labelUrl: label.labelUrl,
      labelData: label.labelData,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to generate shipping label');
    res.status(500).json({ error: error.message || 'Failed to generate shipping label' });
  }
});

/**
 * GET /api/admin/shipping/tracking/:trackingCode
 * Get tracking information
 */
router.get('/tracking/:trackingCode', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { trackingCode } = req.params;
    const trackingInfo = await shippingService.getTrackingInfo(trackingCode);

    res.json({
      success: true,
      trackingInfo,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to get tracking info');
    res.status(500).json({ error: error.message || 'Failed to get tracking info' });
  }
});

export default router;
