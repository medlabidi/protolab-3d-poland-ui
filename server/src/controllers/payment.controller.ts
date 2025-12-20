import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { payuService } from '../services/payu.service';
import { Order } from '../models/Order';
import { logger } from '../config/logger';
import { PayUNotification, PayUOrderStatus } from '../types/payu.types';

export class PaymentController {
  /**
   * Create a BLIK payment
   */
  async createBlikPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId, blikCode } = req.body;
      const customerIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

      // Validate order
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check if order belongs to user
      if (order.user_id !== req.user!.id) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Check if order is already paid
      if (order.payment_status === 'paid') {
        res.status(400).json({ error: 'Order already paid' });
        return;
      }

      // Create BLIK payment with PayU
      const payuResponse = await payuService.createBlikOrder(
        orderId,
        order.price,
        blikCode,
        {
          email: req.user!.email,
        },
        `Order #${orderId} - 3D Print Service`,
        customerIp
      );

      // Check for errors
      if (payuResponse.status.statusCode !== 'SUCCESS') {
      logger.warn({
        orderId,
        status: payuResponse.status,
      }, 'PayU BLIK payment failed');        res.status(400).json({
          error: 'BLIK payment failed',
          code: payuResponse.status.code,
          message: payuResponse.status.statusDesc || 'Invalid BLIK code',
          payuOrderId: payuResponse.orderId,
        });
        return;
      }

      // Update order with PayU order ID
      await Order.updateById(orderId, {
        payment_status: 'on_hold',
      });

      logger.info({
        orderId,
        payuOrderId: payuResponse.orderId,
      }, 'BLIK payment initiated');

      res.json({
        success: true,
        message: 'BLIK payment initiated. Please authorize in your banking app.',
        orderId,
        payuOrderId: payuResponse.orderId,
        status: payuResponse.status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a standard payment (redirects to PayU)
   */
  async createPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const customerIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

      // Validate order
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check if order belongs to user
      if (order.user_id !== req.user!.id) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Check if order is already paid
      if (order.payment_status === 'paid') {
        res.status(400).json({ error: 'Order already paid' });
        return;
      }

      // Create payment with PayU
      const payuResponse = await payuService.createOrder(
        orderId,
        order.price,
        {
          email: req.user!.email,
        },
        `Order #${orderId} - 3D Print Service`,
        customerIp
      );

      // Update order with PayU order ID
      await Order.updateById(orderId, {
        payment_status: 'on_hold',
      });

      logger.info({
        orderId,
        payuOrderId: payuResponse.orderId,
      }, 'Payment initiated');

      res.json({
        success: true,
        redirectUri: payuResponse.redirectUri,
        orderId,
        payuOrderId: payuResponse.orderId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle PayU notification (webhook)
   */
  async handleNotification(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['openpayu-signature'] as string;
      const notification: PayUNotification = req.body;

      // Verify signature
      if (signature) {
        const isValid = payuService.verifyNotificationSignature(
          JSON.stringify(req.body),
          signature.split(';')[1]?.split('=')[1] || ''
        );

        if (!isValid) {
          logger.warn('Invalid PayU notification signature');
          res.status(400).send('Invalid signature');
          return;
        }
      }

      const { order } = notification;
      logger.info({
        orderId: order.extOrderId,
        payuOrderId: order.orderId,
        status: order.status,
      }, 'PayU notification received');

      // Find order in database
      // Note: You may need to add a field to store PayU order ID
      // For now, we'll try to parse it from description or use extOrderId
      const dbOrder = await Order.findById(order.extOrderId || '');

      if (!dbOrder) {
        logger.warn({
          extOrderId: order.extOrderId,
          payuOrderId: order.orderId,
        }, 'Order not found for PayU notification');
        res.status(200).send('OK');
        return;
      }

      // Update order status based on PayU status
      switch (order.status) {
        case PayUOrderStatus.COMPLETED:
          await Order.updateById(dbOrder.id, {
            payment_status: 'paid',
            paid_amount: parseInt(order.totalAmount) / 100,
            status: 'in_queue',
          });
          logger.info({
            orderId: dbOrder.id,
            payuOrderId: order.orderId,
          }, 'Payment completed');
          break;

        case PayUOrderStatus.CANCELED:
          await Order.updateById(dbOrder.id, {
            payment_status: 'refunded',
            status: 'on_hold',
          });
          logger.info({
            orderId: dbOrder.id,
            payuOrderId: order.orderId,
          }, 'Payment cancelled');
          break;

        case PayUOrderStatus.WAITING_FOR_CONFIRMATION:
        case PayUOrderStatus.PENDING:
          await Order.updateById(dbOrder.id, {
            payment_status: 'on_hold',
          });
          break;
      }

      res.status(200).send('OK');
    } catch (error: any) {
      logger.error('Error processing PayU notification:', error);
      next(error);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.params;

      // Validate order
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check if order belongs to user (admins can view all)
      if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      res.json({
        orderId: order.id,
        paymentStatus: order.payment_status,
        paidAmount: order.paid_amount,
        totalAmount: order.price,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
