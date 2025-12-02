import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { orderService } from '../services/order.service';
import { uploadPrintJobFile } from '../services/storage.service';
import { emailService } from '../services/email.service';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export class OrderController {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }
      
      // Generate a temporary order ID for storage
      const tempOrderId = uuidv4();
      
      // Upload file to Supabase Storage
      const { url: fileUrl } = await uploadPrintJobFile(
        tempOrderId,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype
      );
      
      logger.info(`Creating order with price: ${req.body.price}, parsed: ${parseFloat(req.body.price) || 0}`);
      
      const order = await orderService.createOrder(req.user!.id, {
        ...req.body,
        price: parseFloat(req.body.price) || 0,
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

  async updateOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      logger.info(`Updating order ${id} for user ${userId}, body: ${JSON.stringify(req.body)}`);
      
      // First check if order exists and belongs to user
      const existingOrder = await orderService.getOrderById(id, userId);
      
      if (!existingOrder) {
        logger.warn(`Order ${id} not found for user ${userId}`);
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      // Check if request only contains status/payment/project_name updates (allowed for any order)
      const { status, payment_status, paid_amount, project_name, ...otherUpdates } = req.body;
      const hasStatusUpdates = status !== undefined || payment_status !== undefined || paid_amount !== undefined;
      const hasProjectNameUpdate = project_name !== undefined;
      const hasOtherUpdates = Object.keys(otherUpdates).length > 0;
      
      // If there are non-status updates (excluding project_name), check status-based restrictions
      if (hasOtherUpdates) {
        // finished/delivered/suspended orders cannot have non-status fields edited
        if (['finished', 'delivered', 'suspended'].includes(existingOrder.status)) {
          res.status(400).json({ 
            error: 'This order cannot be modified.' 
          });
          return;
        }
      }
      
      // If there are no updates at all
      if (!hasStatusUpdates && !hasOtherUpdates && !hasProjectNameUpdate) {
        res.status(400).json({ error: 'No updates provided' });
        return;
      }
      
      // Delegate the detailed field-level restrictions to the service
      const order = await orderService.updateOrder(id, userId, req.body);
      
      logger.info(`Order updated: ${order.id}`);
      
      res.json({ message: 'Order updated successfully', order });
    } catch (error) {
      next(error);
    }
  }
  
  async getOrderFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user!.id);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      if (order.file_url) {
        res.redirect(order.file_url);
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      next(error);
    }
  }

  async sendPaymentConfirmationEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber, projectName, totalAmount, itemCount, paymentMethod } = req.body;
      const user = req.user!;
      
      // Extract name from email (part before @) as a fallback
      const userName = user.email.split('@')[0] || 'Customer';
      
      await emailService.sendPaymentConfirmationEmail(
        user.email,
        userName,
        {
          orderNumber,
          projectName,
          totalAmount: parseFloat(totalAmount) || 0,
          itemCount: parseInt(itemCount) || 1,
          paymentMethod: paymentMethod || 'Card',
        }
      );
      
      logger.info(`Payment confirmation email sent for user ${user.id}`);
      
      res.json({ message: 'Payment confirmation email sent' });
    } catch (error) {
      next(error);
    }
  }

  async sendRefundRequestEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber, refundAmount, reason, refundMethod } = req.body;
      const user = req.user!;
      
      // Extract name from email (part before @) as a fallback
      const userName = user.email.split('@')[0] || 'Customer';
      
      await emailService.sendRefundRequestEmail(
        user.email,
        userName,
        {
          orderNumber: orderNumber || 'N/A',
          refundAmount: parseFloat(refundAmount) || 0,
          reason: reason || 'order_modification',
          refundMethod: refundMethod || 'original',
        }
      );
      
      logger.info(`Refund request email sent for user ${user.id}, order ${orderNumber}`);
      
      res.json({ message: 'Refund request email sent' });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();