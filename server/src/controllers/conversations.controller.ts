import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { conversationsService } from '../services/conversations.service';
import { logger } from '../config/logger';

export class ConversationsController {
  /**
   * Get all conversations for the current user
   */
  async getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversations = await conversationsService.getUserConversations(userId);
      
      res.json({ conversations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get or create a conversation for an order
   */
  async getOrCreateConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;
      const { subject } = req.body;
      
      const conversation = await conversationsService.getOrCreateConversation(userId, orderId, subject);
      
      res.json({ conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      const conversation = await conversationsService.getConversation(conversationId, userId);
      
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      res.json({ conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      logger.info({ userId, conversationId, limit }, 'User fetching messages');
      
      // Verify user owns this conversation
      const conversation = await conversationsService.getConversation(conversationId, userId);
      if (!conversation) {
        logger.warn({ userId, conversationId }, 'Conversation not found for user');
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      const messages = await conversationsService.getMessages(conversationId, limit);
      logger.info({ conversationId, count: messages.length }, 'Messages fetched successfully');
      
      // Mark messages as read
      await conversationsService.markMessagesAsRead(conversationId, userId);
      
      res.json({ messages });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id, conversationId: req.params.conversationId }, 'Error in getMessages');
      next(error);
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { message, attachments } = req.body;
      
      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      
      // Verify user owns this conversation
      const conversation = await conversationsService.getConversation(conversationId, userId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      const newMessage = await conversationsService.addMessage(conversationId, {
        sender_type: 'user',
        sender_id: userId,
        message: message.trim(),
        attachments: attachments || []
      });
      
      logger.info(`User ${userId} sent message in conversation ${conversationId}`);
      
      res.json({ message: newMessage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total unread message count
   */
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await conversationsService.getTotalUnreadCount(userId);
      
      res.json({ unread_count: count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages in a conversation as read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      // Verify user owns this conversation
      const conversation = await conversationsService.getConversation(conversationId, userId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      await conversationsService.markMessagesAsRead(conversationId, userId);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationsController = new ConversationsController();
