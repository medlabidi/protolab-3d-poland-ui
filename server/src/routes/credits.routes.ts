import { Router } from 'express';
import { creditsController } from '../controllers/credits.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current credit balance
router.get('/balance', creditsController.getBalance);

// Get available credit packages
router.get('/packages', creditsController.getPackages);

// Purchase credits
router.post('/purchase', creditsController.purchaseCredits);

// Get transaction history
router.get('/transactions', creditsController.getTransactionHistory);

// Use credits for payment
router.post('/use', creditsController.useCreditsForPayment);

export default router;
