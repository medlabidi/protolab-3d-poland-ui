import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/admin/analytics
 * Get analytics data
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is attached by authenticate middleware
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    
    const analytics = await analyticsService.getAnalytics(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch analytics');
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

export default router;
