import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { creditsService } from '../services/credits.service';
import { logger } from '../config/logger';

export class CreditsController {
  /**
   * Get current user's credit balance
   */
  async getBalance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const balance = await creditsService.getBalance(userId);
      
      res.json({ balance });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available credit packages
   */
  async getPackages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const packages = creditsService.getCreditPackages();
      res.json({ packages });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Purchase credits (simulates payment processing)
   */
  async purchaseCredits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { packageId, paymentMethod } = req.body;
      
      // Get available packages
      const packages = creditsService.getCreditPackages();
      const selectedPackage = packages.find(p => p.id === packageId);
      
      if (!selectedPackage) {
        res.status(400).json({ error: 'Invalid package selected' });
        return;
      }
      
      // In production, process payment here
      // For now, simulate successful payment
      
      const { balance, transaction } = await creditsService.addCredits(
        userId,
        selectedPackage.amount,
        'purchase',
        `Purchased ${selectedPackage.amount} PLN credit package (${selectedPackage.bonus > 0 ? `+${selectedPackage.bonus} bonus` : 'no bonus'})`
      );
      
      logger.info(`User ${userId} purchased ${selectedPackage.amount} credits via ${paymentMethod}`);
      
      res.json({
        message: 'Credits purchased successfully',
        balance,
        transaction,
        creditsAdded: selectedPackage.amount,
        bonus: selectedPackage.bonus
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const transactions = await creditsService.getTransactionHistory(userId, limit);
      
      res.json({ transactions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Use credits for payment (partial or full)
   */
  async useCreditsForPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, orderId, description } = req.body;
      
      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
      }
      
      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }
      
      const { balance, transaction } = await creditsService.useCredits(
        userId,
        amount,
        orderId,
        description
      );
      
      logger.info(`User ${userId} used ${amount} credits for order ${orderId}`);
      
      res.json({
        message: 'Credits applied successfully',
        balance,
        transaction,
        creditsUsed: amount
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Insufficient credits') {
        res.status(400).json({ error: 'Insufficient credits' });
        return;
      }
      next(error);
    }
  }
}

export const creditsController = new CreditsController();
