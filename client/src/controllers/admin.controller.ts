import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { orderService } from '../services/order.service';
import { settingsService } from '../services/settings.service';
import { logger } from '../config/logger';

export class AdminController {
  async getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getAllOrders();
      
      res.json({ orders, count: orders.length });
    } catch (error) {
      next(error);
    }
  }
  
  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await orderService.updateOrderStatus(id, status);
      
      logger.info(`Order status updated: ${order._id} -> ${status}`);
      
      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      next(error);
    }
  }
  
  async updateOrderPricing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { materialWeight, printTime } = req.body;
      
      const order = await orderService.updateOrderPricing(id, materialWeight, printTime);
      
      logger.info(`Order pricing updated: ${order._id}`);
      
      res.json({
        message: 'Order pricing updated successfully',
        order,
        recalculatedPrice: order.price,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateOrderTracking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { trackingCode } = req.body;
      
      const order = await orderService.updateOrderTracking(id, trackingCode);
      
      logger.info(`Tracking code added to order: ${order._id}`);
      
      res.json({ message: 'Tracking code updated successfully', order });
    } catch (error) {
      next(error);
    }
  }
  
  async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
  
  async updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.updateSettings(req.body);
      
      logger.info('Settings updated');
      
      res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();