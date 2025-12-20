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
        materialWeight: req.body.materialWeight ? parseFloat(req.body.materialWeight) : undefined,
        printTime: req.body.printTime ? parseFloat(req.body.printTime) : undefined,
        modelVolume: req.body.modelVolume ? parseFloat(req.body.modelVolume) : undefined,
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
      const filter = req.query.filter as 'active' | 'archived' | 'deleted' | undefined;
      
      let orders;
      if (filter && ['active', 'archived', 'deleted'].includes(filter)) {
        orders = await orderService.getUserOrdersFiltered(req.user!.id, filter);
      } else {
        orders = await orderService.getUserOrders(req.user!.id);
      }
      
      res.json({ orders, count: orders.length });
    } catch (error) {
      next(error);
    }
  }

  async archiveOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.archiveOrder(id, req.user!.id);
      
      logger.info(`Order archived: ${order.id}`);
      
      res.json({ message: 'Order archived successfully', order });
    } catch (error) {
      next(error);
    }
  }

  async restoreOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.restoreOrder(id, req.user!.id);
      
      logger.info(`Order restored: ${order.id}`);
      
      res.json({ message: 'Order restored successfully', order });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.softDeleteOrder(id, req.user!.id);
      
      logger.info(`Order soft deleted: ${order.id}`);
      
      res.json({ message: 'Order moved to trash', order });
    } catch (error) {
      next(error);
    }
  }

  async permanentDeleteOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await orderService.permanentDeleteOrder(id, req.user!.id);
      
      logger.info(`Order permanently deleted: ${id}`);
      
      res.json({ message: 'Order permanently deleted' });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.cancelOrder(id, req.user!.id);
      
      // Send notification to user about cancellation
      const { notificationService } = await import('../services/notification.service');
      await notificationService.notifyOrderStatusChange(
        req.user!.id,
        order.id,
        'suspended',
        order.order_number
      );

      logger.info(`Order cancelled: ${order.id} by user ${req.user!.id}`);
      
      res.json({ message: 'Order cancelled successfully', order });
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

  async submitRefundRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { refundMethod, refundAmount, reason, bankDetails } = req.body;
      const userId = req.user!.id;
      
      logger.info(`Submitting refund request for order ${id} by user ${userId}`);
      
      // Update the order with refund information
      const updatedOrder = await orderService.submitRefundRequest(
        id,
        userId,
        {
          refundMethod,
          refundAmount: parseFloat(refundAmount) || 0,
          reason: reason || 'customer_request',
          bankDetails,
        }
      );
      
      logger.info(`Refund request submitted for order ${id}`);
      
      res.json({
        message: 'Refund request submitted successfully',
        order: updatedOrder,
      });
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

  async sendInvoiceEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        orderNumber, 
        projectName, 
        items, 
        subtotal, 
        deliveryPrice,
        totalAmount, 
        paymentMethod,
        billingInfo 
      } = req.body;
      const user = req.user!;
      
      // Extract name from email (part before @) as a fallback
      const userName = user.email.split('@')[0] || 'Customer';
      
      // Generate invoice number: INV-YYYYMMDD-XXXX
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const invoiceNumber = `INV-${dateStr}-${randomPart}`;
      
      // Format dates
      const invoiceDate = now.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      const dueDate = invoiceDate; // Already paid
      
      // Calculate VAT (23% in Poland)
      const vatRate = 23;
      const netAmount = parseFloat(totalAmount) / 1.23; // Assuming prices include VAT
      const vatAmount = parseFloat(totalAmount) - netAmount;
      
      // Format items for invoice
      const formattedItems = items.map((item: any) => ({
        description: item.description || item.name || 'Print Service',
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || parseFloat(item.price) || 0,
        total: parseFloat(item.total) || parseFloat(item.price) || 0,
      }));
      
      // Add delivery as a line item if present
      if (deliveryPrice && parseFloat(deliveryPrice) > 0) {
        formattedItems.push({
          description: 'Delivery',
          quantity: 1,
          unitPrice: parseFloat(deliveryPrice),
          total: parseFloat(deliveryPrice),
        });
      }
      
      const result = await emailService.sendInvoiceEmail(
        user.email,
        userName,
        {
          invoiceNumber,
          invoiceDate,
          dueDate,
          orderNumber,
          projectName,
          items: formattedItems,
          subtotal: parseFloat(subtotal) || netAmount,
          vatRate,
          vatAmount,
          totalAmount: parseFloat(totalAmount) || 0,
          paymentMethod: paymentMethod || 'Card',
          billingInfo: {
            companyName: billingInfo.companyName || '',
            taxId: billingInfo.taxId || billingInfo.nip || '',
            vatNumber: billingInfo.vatNumber || '',
            address: billingInfo.billingAddress || billingInfo.address || '',
            city: billingInfo.billingCity || billingInfo.city || '',
            zipCode: billingInfo.billingZipCode || billingInfo.zipCode || '',
            country: billingInfo.billingCountry || billingInfo.country || 'Poland',
          },
        }
      );
      
      logger.info(`Invoice email sent for user ${user.id}, invoice ${invoiceNumber}`);
      
      res.json({ 
        message: 'Invoice email sent',
        invoiceNumber: result.invoiceNumber,
        success: result.success,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();