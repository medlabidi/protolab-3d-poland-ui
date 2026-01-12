import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { orderService } from '../services/order.service';
import { settingsService } from '../services/settings.service';
import { authService } from '../services/auth.service';
import { materialService } from '../services/material.service';
import { printerService } from '../services/printer.service';
import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

export class AdminController {
  async getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_name, user_id } = req.query;
      const supabase = getSupabase();
      
      // If project_name or user_id is provided, filter by it
      if (project_name || user_id) {
        let query = supabase
          .from('orders')
          .select('*, users(name, email)')
          .order('created_at', { ascending: false });
        
        if (project_name) {
          query = query.eq('project_name', project_name);
        }
        
        if (user_id) {
          query = query.eq('user_id', user_id);
        }
        
        const { data: orders, error } = await query;
        
        if (error) throw error;
        res.json({ orders: orders || [], count: orders?.length || 0 });
        return;
      }
      
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
      const { status, payment_status, tracking_code } = req.body;
      
      const supabase = getSupabase();
      const updates: any = {};
      
      if (status) updates.status = status;
      if (payment_status) updates.payment_status = payment_status;
      if (tracking_code !== undefined) updates.tracking_code = tracking_code;
      
      const { data: order, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select('*, users(id, email, name)')
        .single();
      
      if (error) throw error;
      if (!order) throw new Error('Order not found');
      
      // Send notification to user if status changed
      if (status && order.user_id) {
        const { notificationService } = await import('../services/notification.service');
        await notificationService.notifyOrderStatusChange(order.user_id, order.id, status, order.order_number);
        
        // Send email notification
        const { emailService } = await import('../services/email.service');
        const userEmail = order.users?.email;
        const userName = order.users?.name || 'Customer';
        if (userEmail) {
          await emailService.sendOrderStatusChangeEmail(
            userEmail,
            userName,
            order.order_number || order.id.substring(0, 8),
            status,
            order.id
          );
        }
      }
      
      // Handle refund credit when payment_status changes to 'refunded'
      if (payment_status === 'refunded' && order.refund_method === 'credit') {
        const { creditsService } = await import('../services/credits.service');
        await creditsService.addCredits(
          order.user_id,
          order.price,
          'refund_bonus',
          `Refund for order #${order.order_number || order.id.substring(0, 8)}`
        );
        logger.info(`Added ${order.price} PLN credit refund for user ${order.user_id}`);
      }
      
      // Auto-close conversations if order reached terminal status
      if (status) {
        const { conversationsService } = await import('../services/conversations.service');
        await conversationsService.autoCloseConversationsForOrder(id, status);
      }
      
      logger.info(`Order updated: ${order.id}`);
      
      res.json({ message: 'Order updated successfully', order });
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

  async getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const supabase = getSupabase();
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        return;
      }

      const supabase = getSupabase();
      
      const { data: user, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      
      if (error || !user) {
        res.status(404).json({ error: 'User not found or update failed' });
        return;
      }

      logger.info(`User ${id} role updated to ${role} by admin ${req.user?.id}`);
      res.json({ message: 'User role updated successfully', user });
    } catch (error) {
      next(error);
    }
  }

  // Conversations and Support Messages
  async getAllConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabase();
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          orders!inner (
            id,
            file_name,
            project_name,
            status
          ),
          users!inner (
            id,
            name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error({ error }, 'Error fetching conversations');
        throw new Error('Failed to fetch conversations');
      }

      // Get unread counts for each conversation
      const conversationsWithCounts = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          const { count } = await supabase
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_type', 'engineer');

          return {
            ...conv,
            unread_count: count || 0
          };
        })
      );

      res.json({ conversations: conversationsWithCounts, count: conversationsWithCounts.length });
    } catch (error) {
      next(error);
    }
  }

  async getConversationMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;

      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error({ error, conversationId }, 'Error fetching messages');
        throw new Error('Failed to fetch messages');
      }

      res.json({ messages: messages || [] });
    } catch (error) {
      next(error);
    }
  }

  async sendMessageToUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;
      const { message } = req.body;

      const { data: newMessage, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'engineer',
          sender_id: req.user!.id,
          message,
          attachments: [],
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        logger.error({ error, conversationId }, 'Error sending message');
        throw new Error('Failed to send message');
      }

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      logger.info({ conversationId, messageId: newMessage.id }, 'Admin message sent');

      res.json({ message: newMessage });
    } catch (error) {
      next(error);
    }
  }

  async updateConversationStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;
      const { status } = req.body;

      const { data: conversation, error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        logger.error({ error, conversationId }, 'Error updating conversation status');
        throw new Error('Failed to update conversation status');
      }

      logger.info({ conversationId, status }, 'Conversation status updated');

      res.json({ message: 'Conversation status updated', conversation });
    } catch (error) {
      next(error);
    }
  }

  async markConversationMessagesAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;

      const { error } = await supabase
        .from('conversation_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_type', 'engineer');

      if (error) {
        logger.error({ error, conversationId }, 'Error marking messages as read');
        throw new Error('Failed to mark messages as read');
      }

      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }

  // Materials management
  async getAllMaterials(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const materials = await materialService.getAllMaterials();
      
      res.json({ materials, count: materials.length });
    } catch (error) {
      next(error);
    }
  }

  async getMaterialById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const material = await materialService.getMaterialById(id);
      
      if (!material) {
        res.status(404).json({ error: 'Material not found' });
        return;
      }
      
      res.json({ material });
    } catch (error) {
      next(error);
    }
  }

  async createMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await materialService.createMaterial(req.body);
      
      logger.info({ materialId: material.id }, 'Material created');
      
      res.status(201).json({ message: 'Material created successfully', material });
    } catch (error) {
      next(error);
    }
  }

  async updateMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const material = await materialService.updateMaterial(id, req.body);
      
      logger.info({ materialId: material.id }, 'Material updated');
      
      res.json({ message: 'Material updated successfully', material });
    } catch (error) {
      next(error);
    }
  }

  async deleteMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await materialService.deleteMaterial(id);
      
      logger.info({ materialId: id }, 'Material deleted');
      
      res.json({ message: 'Material deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Printers management
  async getAllPrinters(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const printers = await printerService.getAllPrinters();
      
      res.json({ printers, count: printers.length });
    } catch (error) {
      next(error);
    }
  }

  async getPrinterById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const printer = await printerService.getPrinterById(id);
      
      if (!printer) {
        res.status(404).json({ error: 'Printer not found' });
        return;
      }
      
      res.json({ printer });
    } catch (error) {
      next(error);
    }
  }

  async createPrinter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const printer = await printerService.createPrinter(req.body);
      
      logger.info({ printerId: printer.id }, 'Printer created');
      
      res.status(201).json({ message: 'Printer created successfully', printer });
    } catch (error) {
      next(error);
    }
  }

  async updatePrinter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const printer = await printerService.updatePrinter(id, req.body);
      
      logger.info({ printerId: printer.id }, 'Printer updated');
      
      res.json({ message: 'Printer updated successfully', printer });
    } catch (error) {
      next(error);
    }
  }

  async deletePrinter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await printerService.deletePrinter(id);
      
      logger.info({ printerId: id }, 'Printer deleted');
      
      res.json({ message: 'Printer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultPrinter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const printer = await printerService.setDefaultPrinter(id);
      
      logger.info({ printerId: printer.id }, 'Default printer set');
      
      res.json({ message: 'Default printer set successfully', printer });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();