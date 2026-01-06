import { Request, Response } from 'express';
import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

export const adminConversationsController = {
  /**
   * Get all conversations with pagination and filters
   */
  async getAllConversations(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { page = 1, limit = 20, status, userId, search } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('conversations')
        .select(
          `
          id,
          order_id,
          user_id,
          subject,
          status,
          created_at,
          updated_at,
          users:user_id(id, name, email),
          orders:order_id(id, file_name, status, created_at)
          `,
          { count: 'exact' }
        )
        .range(offset, offset + limitNum - 1)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error({ err: error }, 'Supabase query error');
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return res.json({
            success: true,
            conversations: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              pages: 0,
            },
            message: 'Conversations table not yet initialized',
          });
        }
        throw error;
      }

      // Get last message for each conversation
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conversation: any) => {
          try {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const lastMessage = messages?.[0] || null;
            
            // Count unread messages from users (for admins)
            const { data: unreadMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', conversation.id)
              .eq('sender_type', 'user')
              .eq('is_read', false);

            return {
              ...conversation,
              user: conversation.users,
              users: undefined,
              order: conversation.orders,
              orders: undefined,
              last_message: lastMessage,
              unread_count: unreadMessages?.length || 0,
            };
          } catch (err) {
            logger.error({ err }, `Failed to enrich conversation ${conversation.id}`);
            return {
              ...conversation,
              user: conversation.users,
              users: undefined,
              order: conversation.orders,
              orders: undefined,
              last_message: null,
              unread_count: 0,
            };
          }
        })
      );

      // Apply search filter in memory if needed
      let filtered = enrichedConversations;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = enrichedConversations.filter(conv => 
          conv.user?.name?.toLowerCase().includes(searchLower) ||
          conv.user?.email?.toLowerCase().includes(searchLower) ||
          conv.subject?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        success: true,
        conversations: filtered,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitNum),
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching conversations');
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;

      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          users:user_id(id, name, email, avatar),
          orders:order_id(id, file_name, status, price, created_at)
          `
        )
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({
        success: true,
        conversation: {
          ...data,
          user: data.users,
          users: undefined,
          order: data.orders,
          orders: undefined,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching conversation');
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  /**
   * Get all messages in a conversation
   */
  async getConversationMessages(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;
      const { limit = 50 } = req.query;

      const { data, error } = await supabase
        .from('messages')
        .select('*, users:sender_id(id, name, email, avatar)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit as number);

      if (error) throw error;

      const enrichedMessages = data?.map((message: any) => ({
        ...message,
        sender: message.users,
        users: undefined,
      }));

      res.json({
        success: true,
        messages: enrichedMessages,
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching messages');
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  /**
   * Send a message from admin to conversation
   */
  async sendConversationMessage(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;
      const { message } = req.body;
      const userId = (req as any).user?.id;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // Verify conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Create message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'engineer',
          sender_id: userId,
          message: message.trim(),
          attachments: [],
          is_read: false,
        })
        .select('*, users:sender_id(id, name, email, avatar)')
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      res.status(201).json({
        success: true,
        message: {
          ...data,
          sender: data.users,
          users: undefined,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Error sending message');
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  /**
   * Update conversation status
   */
  async updateConversationStatus(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;
      const { status } = req.body;

      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const { data, error } = await supabase
        .from('conversations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        conversation: data,
      });
    } catch (error) {
      logger.error({ err: error }, 'Error updating conversation status');
      res.status(500).json({ error: 'Failed to update conversation status' });
    }
  },

  /**
   * Mark conversation messages as read
   */
  async markConversationAsRead(req: Request, res: Response) {
    try {
      const supabase = getSupabase();
      const { conversationId } = req.params;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'user');

      if (error) throw error;

      res.json({
        success: true,
        message: 'Conversation marked as read',
      });
    } catch (error) {
      logger.error({ err: error }, 'Error marking conversation as read');
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  },
};
