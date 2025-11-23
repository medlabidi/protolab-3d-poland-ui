import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { orderService } from '../services/order.service';
import { s3Service } from '../services/s3.service';
import { logger } from '../config/logger';

export class OrderController {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }
      
      const fileUrl = await s3Service.uploadFile(req.file);
      
      const order = await orderService.createOrder(req.user!.id, {
        ...req.body,
        fileName: req.file.originalname,
        fileUrl,
      });
      
      logger.info(`Order created: ${order.id}`);
      
      res.status(201).json({
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getMyOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getUserOrders(req.user!.id);
      
      res.json({ orders, count: orders.length });
    } catch (error) {
      next(error);
    }
  }
  
  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user!.id);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      res.json({ order });
    } catch (error) {
      next(error);
    }
  }
  
  async addReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { review } = req.body;
      
      const order = await orderService.addReview(id, req.user!.id, review);
      
      logger.info(`Review added to order: ${order.id}`);
      
      res.json({ message: 'Review added successfully', order });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();