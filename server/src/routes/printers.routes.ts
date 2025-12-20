import { Router } from 'express';
import { printerService } from '../services/printer.service';
import { logger } from '../config/logger';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Public endpoint to get default printer specs for pricing calculations
router.get('/default', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const printer = await printerService.getDefaultPrinter();
    
    // Return only pricing-relevant specs
    res.json({
      printer: {
        power_watts: printer.power_watts,
        cost_pln: printer.cost_pln,
        lifespan_hours: printer.lifespan_hours,
        maintenance_rate: printer.maintenance_rate || 0.03,
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching default printer');
    // Return fallback values if no printer found
    res.json({
      printer: {
        power_watts: 270,
        cost_pln: 3483.39,
        lifespan_hours: 5000,
        maintenance_rate: 0.03,
      }
    });
  }
});

export default router;
