import { Router } from 'express';
import { pricingService } from '../services/pricing.service';

const router = Router();

router.post('/calculate', (req, res) => {
  try {
    const { materialType, color, materialWeightGrams, printTimeHours, laborTimeMinutes, deliveryFee } = req.body;

    if (!materialType || !color || !materialWeightGrams || !printTimeHours) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const pricing = pricingService.calculatePrice({
      materialType,
      color,
      materialWeightGrams,
      printTimeHours,
      laborTimeMinutes,
      deliveryFee,
    });

    res.json(pricing);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
});

export default router;
