import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { orderService } from '../services/order.service';
import { settingsService } from '../services/settings.service';
import { authService } from '../services/auth.service';
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
  
  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.params;
      
      if (type !== 'print' && type !== 'design') {
        res.status(400).json({ error: 'Invalid order type. Must be "print" or "design"' });
        return;
      }
      
      const orders = await orderService.getOrdersByType(type);
      
      res.json({ orders, count: orders.length, type });
    } catch (error) {
      next(error);
    }
  }

  async createPrintFromDesign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { designOrderId } = req.params;
      const { material, color, layerHeight, infill, quantity, price } = req.body;
      
      if (!material || !color || !layerHeight || !infill || !quantity || !price) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      const printOrder = await orderService.createPrintFromDesign(designOrderId, {
        material,
        color,
        layerHeight,
        infill,
        quantity,
        price
      });
      
      res.status(201).json({ order: printOrder });
    } catch (error: any) {
      if (error.message === 'Design order not found' || error.message === 'Parent order must be a design order') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
  
  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await orderService.updateOrderStatus(id, status);
      
      logger.info(`Order status updated: ${order.id} -> ${status}`);
      
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
      
      logger.info(`Order pricing updated: ${order.id}`);
      
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
      
      logger.info(`Tracking code added to order: ${order.id}`);
      
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

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await authService.getAllUsers();
      
      res.json({ users, count: users.length });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();