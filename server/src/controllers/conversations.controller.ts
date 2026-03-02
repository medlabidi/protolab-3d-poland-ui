import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { conversationsService } from '../services/conversations.service';
import { logger } from '../config/logger';
import { getSupabase } from '../config/database';

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
   * Get conversation by design request ID
   */
  async getConversationByDesignRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { designRequestId } = req.params;
      
      // For admins, get conversation regardless of user_id
      // For regular users, only get their own conversations
      let conversation;
      if (userRole === 'admin') {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('design_request_id', designRequestId)
          .maybeSingle();
        conversation = data;
      } else {
        conversation = await conversationsService.getConversationByDesignRequest(designRequestId, userId);
      }
      
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found', conversation: null, messages: [] });
        return;
      }
      
      // Get messages for this conversation - fetch all messages (no limit)
      const messages = await conversationsService.getMessages(conversation.id, 10000);
      
      res.json({ conversation, messages });
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, 'Error in getConversationByDesignRequest');
      next(error);
    }
  }

  /**
   * Get or create a conversation for a design request
   */
  async getOrCreateDesignRequestConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { designRequestId } = req.params;
      
      logger.info({ adminId, designRequestId }, 'Admin creating/getting conversation for design request');
      
      const conversation = await conversationsService.getOrCreateDesignRequestConversation(designRequestId, adminId);
      
      logger.info({ conversationId: conversation.id }, 'Conversation created/retrieved successfully');
      
      res.json({ conversation });
    } catch (error) {
      logger.error({ err: error, adminId: req.user?.id }, 'Error in getOrCreateDesignRequestConversation');
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
      const userRole = req.user!.role;
      const { conversationId } = req.params;
      const { message } = req.body;
      const file = req.file;
      
      // Message is optional if file is present
      if (!message?.trim() && !file) {
        res.status(400).json({ error: 'Message or file is required' });
        return;
      }
      
      // For admins, we don't need to verify ownership - they can send to any conversation
      // For users, verify they own the conversation
      if (userRole !== 'admin') {
        const conversation = await conversationsService.getConversation(conversationId, userId);
        if (!conversation) {
          res.status(404).json({ error: 'Conversation not found' });
          return;
        }
      }
      
      // Determine sender type based on role
      const senderType = userRole === 'admin' ? 'engineer' : 'user';
      
      // Build attachments array if file is uploaded
      const attachments = [];
      if (file) {
        logger.info({ 
          filename: file.originalname, 
          size: file.size, 
          mimetype: file.mimetype,
          path: file.path,
          destination: file.destination 
        }, 'Processing uploaded file');
        
        // Verify file exists and has content
        const fs = await import('fs/promises');
        try {
          const stats = await fs.stat(file.path);
          logger.info({ filename: file.originalname, actualSize: stats.size }, 'File saved to disk successfully');
          
          if (stats.size === 0) {
            logger.error({ filename: file.originalname }, 'File is empty (0 bytes)');
            res.status(400).json({ error: 'Uploaded file is empty' });
            return;
          }
          
          // Check if file is actually HTML (error page)
          const buffer = await fs.readFile(file.path);
          const header = buffer.toString('utf-8', 0, Math.min(100, buffer.length));
          if (header.toLowerCase().includes('<!doctype') || header.toLowerCase().includes('<html')) {
            logger.error({ filename: file.originalname, header: header.substring(0, 50) }, 'File appears to be HTML, not a binary 3D file');
            res.status(400).json({ error: 'Invalid file format: Expected binary 3D file, received HTML' });
            return;
          }
        } catch (statError) {
          logger.error({ error: statError, filename: file.originalname }, 'Failed to verify uploaded file');
        }
        
        // Check if it's a 3D file and admin is sending
        const is3DFile = /\.(stl|obj|3mf|step|stp|iges|igs|gltf|glb)$/i.test(file.originalname);
        
        let fileUrl = `/uploads/${file.filename}`;
        
        // If admin sends a 3D file, upload to S3 for better accessibility
        if (userRole === 'admin' && is3DFile) {
          try {
            const { s3Service } = await import('../services/s3.service');
            const s3Key = await s3Service.upload3DDesignFile(file);
            fileUrl = `s3://${s3Key}`; // Store S3 key with s3:// prefix
            logger.info({ s3Key, filename: file.originalname, fileSize: file.size }, 'Uploaded 3D file to S3');
          } catch (s3Error) {
            logger.error({ error: s3Error, filename: file.originalname }, 'Failed to upload to S3, using local storage');
            // Fallback to local storage if S3 fails
          }
        }
        
        attachments.push({
          name: file.originalname,
          url: fileUrl,
          size: file.size,
          type: file.mimetype
        });
        
        logger.info({ 
          filename: file.originalname, 
          url: fileUrl, 
          is3DFile, 
          isS3: fileUrl.startsWith('s3://') 
        }, 'File attachment prepared');
      }
      
      const newMessage = await conversationsService.addMessage(conversationId, {
        sender_type: senderType,
        sender_id: userId,
        message: message?.trim() || `Attached file: ${file?.originalname || 'file'}`,
        attachments: attachments
      });
      
      logger.info({ userId, conversationId, senderType, hasFile: !!file }, 'Message sent successfully');
      
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
