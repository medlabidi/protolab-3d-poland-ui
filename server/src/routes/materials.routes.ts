import { Router } from 'express';
import { materialService } from '../services/material.service';
import { logger } from '../config/logger';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Public endpoint to get available materials for users
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materials = await materialService.getMaterialAvailability();
    
    res.json({ materials });
  } catch (error) {
    logger.error({ error }, 'Error fetching available materials');
    next(error);
  }
});

// Public endpoint to get materials grouped by type
router.get('/by-type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materialsByType = await materialService.getMaterialsByType();
    
    res.json({ materials: materialsByType });
  } catch (error) {
    logger.error({ error }, 'Error fetching materials by type');
    next(error);
  }
});

export default router;
