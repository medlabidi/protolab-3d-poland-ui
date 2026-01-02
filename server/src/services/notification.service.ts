import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

class NotificationService {
  /**
   * Send notification to user when order status changes
   */
  async notifyOrderStatusChange(
    userId: string,
    orderId: string,
    newStatus: string,
    orderNumber?: string
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // Create a notification record
      const notification = {
        user_id: userId,
        type: 'order_status_change',
        title: `Order Status Updated`,
        message: `Your order ${orderNumber ? `#${orderNumber}` : ''} status changed to: ${newStatus.replace('_', ' ')}`,
        data: {
          orderId,
          newStatus,
          orderNumber,
        },
        read: false,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (error) {
        logger.error({ err: error }, `Failed to create notification for user ${userId}`);
      } else {
        logger.info(`Notification sent to user ${userId} for order ${orderId} status change to ${newStatus}`);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error in notifyOrderStatusChange');
    }
  }
  
  /**
   * Send notification when refund is processed
   */
  async notifyRefundProcessed(
    userId: string,
    orderId: string,
    amount: number,
    method: string,
    orderNumber?: string
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      
      const methodText = method === 'credit' 
        ? 'as platform credit to your wallet' 
        : 'to your original payment method';
      
      const notification = {
        user_id: userId,
        type: 'refund_processed',
        title: 'Refund Processed',
        message: `Your refund of ${amount.toFixed(2)} PLN for order ${orderNumber ? `#${orderNumber}` : ''} has been processed ${methodText}.`,
        data: {
          orderId,
          amount,
          method,
          orderNumber,
        },
        read: false,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (error) {
        logger.error({ err: error }, `Failed to create refund notification for user ${userId}`);
      } else {
        logger.info(`Refund notification sent to user ${userId} for order ${orderId}`);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error in notifyRefundProcessed');
    }
  }
}

export const notificationService = new NotificationService();
