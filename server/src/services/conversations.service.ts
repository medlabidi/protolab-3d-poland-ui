import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

export interface Conversation {
  id: string;
  order_id?: string;
  design_request_id?: string;
  user_id: string;
  subject?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  // Joined fields
  order?: {
    id: string;
    file_name: string;
    project_name?: string;
    status: string;
  };
  design_request?: {
    id: string;
    project_description: string;
    status: string;
  };
  unread_count?: number;
  last_message?: ConversationMessage;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'engineer' | 'system';
  sender_id?: string;
  message: string;
  attachments: any[];
  is_read: boolean;
  created_at: string;
}

export class ConversationsService {
  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          orders (
            id,
            file_name,
            project_name,
            status
          ),
          design_requests (
            id,
            project_description,
            status
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('Conversations table does not exist yet');
          return [];
        }
        logger.error({ err: error }, `Failed to get conversations for user ${userId}`);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get unread counts and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv: any) => {
          const unreadCount = await this.getUnreadCount(conv.id, userId);
          const lastMessage = await this.getLastMessage(conv.id);
          
          return {
            ...conv,
            order: conv.orders,
            design_request: conv.design_requests,
            unread_count: unreadCount,
            last_message: lastMessage
          };
        })
      );
      
      return conversationsWithDetails;
    } catch (err) {
      logger.error({ err }, `Error getting conversations for user ${userId}`);
      return [];
    }
  }

  /**
   * Get or create a conversation for an order
   */
  async getOrCreateConversation(userId: string, orderId: string, subject?: string): Promise<Conversation> {
    const supabase = getSupabase();
    
    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        orders!inner (
          id,
          file_name,
          project_name,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .single();
    
    if (existing) {
      return {
        ...existing,
        order: existing.orders
      };
    }
    
    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        user_id: userId,
        order_id: orderId,
        subject: subject || 'Support Request',
        status: 'open'
      }])
      .select(`
        *,
        orders!inner (
          id,
          file_name,
          project_name,
          status
        )
      `)
      .single();
    
    if (createError) {
      logger.error({ err: createError }, `Failed to create conversation for order ${orderId}`);
      throw new Error('Failed to create conversation');
    }
    
    // Conversation created empty - no system message added
    logger.info(`Created conversation ${newConv.id} for order ${orderId}`);
    
    return {
      ...newConv,
      order: newConv.orders
    };
  }

  /**
   * Get conversation by design request ID
   */
  async getConversationByDesignRequest(designRequestId: string, userId: string): Promise<Conversation | null> {
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('design_request_id', designRequestId)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No conversation found
          return null;
        }
        logger.error({ err: error }, `Failed to get conversation for design request ${designRequestId}`);
        return null;
      }
      
      return data;
    } catch (err) {
      logger.error({ err }, `Error getting conversation for design request ${designRequestId}`);
      return null;
    }
  }

  /**
   * Get or create a conversation for a design request
   */
  async getOrCreateDesignRequestConversation(designRequestId: string, adminId?: string): Promise<Conversation> {
    const supabase = getSupabase();
    
    logger.info({ designRequestId, adminId }, 'Starting getOrCreateDesignRequestConversation');
    
    // First get the design request to find the user_id
    const { data: designRequest, error: fetchDesignError } = await supabase
      .from('design_requests')
      .select('user_id')
      .eq('id', designRequestId)
      .single();
    
    if (fetchDesignError) {
      logger.error({ err: fetchDesignError, designRequestId }, `Error fetching design request`);
      throw new Error(`Design request not found: ${fetchDesignError.message}`);
    }
    
    if (!designRequest) {
      logger.error({ designRequestId }, `Design request not found - no data returned`);
      throw new Error('Design request not found');
    }
    
    const userId = designRequest.user_id;
    
    logger.info({ userId, designRequestId, adminId }, 'Checking for existing conversation');
    
    // Check if conversation already exists for this user and design request
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('design_request_id', designRequestId)
      .single();
    
    if (existing) {
      logger.info({ conversationId: existing.id }, 'Found existing conversation');
      return existing;
    }
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error({ err: fetchError }, 'Error fetching conversation');
    }
    
    logger.info({ userId, designRequestId }, 'Creating new conversation');
    
    // Create new conversation with the user_id from design request
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        user_id: userId,
        design_request_id: designRequestId,
        subject: 'Design Assistance Request',
        status: 'open'
      }])
      .select('*')
      .single();
    
    if (createError) {
      logger.error({ err: createError, userId, designRequestId }, `Failed to create conversation - Details: ${JSON.stringify(createError)}`);
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }
    
    if (!newConv) {
      logger.error({ userId, designRequestId }, 'No conversation data returned after insert');
      throw new Error('Failed to create conversation - no data returned');
    }
    
    logger.info({ conversationId: newConv.id, userId, designRequestId }, `Successfully created conversation`);
    
    return newConv;
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        orders!inner (
          id,
          file_name,
          project_name,
          status
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error({ err: error }, `Failed to get conversation ${conversationId}`);
      return null;
    }
    
    return {
      ...data,
      order: data.orders
    };
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 10000): Promise<ConversationMessage[]> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      logger.error({ err: error, conversationId, errorCode: error.code }, `Failed to get messages for conversation ${conversationId}`);
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn('conversation_messages table does not exist yet');
        return [];
      }
      return [];
    }
    
    return data as ConversationMessage[];
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    message: {
      sender_type: 'user' | 'engineer' | 'system';
      sender_id?: string;
      message: string;
      attachments?: any[];
    }
  ): Promise<ConversationMessage> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: message.sender_type,
        sender_id: message.sender_id || null,
        message: message.message,
        attachments: message.attachments || [],
        is_read: message.sender_type === 'user' // Auto-read own messages
      }])
      .select()
      .single();
    
    if (error) {
      logger.error({ err: error }, `Failed to add message to conversation ${conversationId}`);
      throw new Error('Failed to send message');
    }
    
    // If user sent a message, update conversation status to in_progress if it was open
    if (message.sender_type === 'user') {
      await supabase
        .from('conversations')
        .update({ status: 'in_progress' })
        .eq('id', conversationId)
        .eq('status', 'open');
    }
    
    logger.info(`Message added to conversation ${conversationId}`);
    
    return data as ConversationMessage;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const supabase = getSupabase();
    
    // Only mark non-user messages as read
    const { error } = await supabase
      .from('conversation_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_type', 'user');
    
    if (error) {
      logger.error({ err: error }, `Failed to mark messages as read for conversation ${conversationId}`);
    }
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const supabase = getSupabase();
    
    const { count, error } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_type', 'user')
      .eq('is_read', false);
    
    if (error) {
      return 0;
    }
    
    return count || 0;
  }

  /**
   * Get total unread count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const supabase = getSupabase();
    
    // Get all conversation IDs for the user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);
    
    if (convError || !conversations?.length) {
      return 0;
    }
    
    const conversationIds = conversations.map(c => c.id);
    
    const { count, error } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_type', 'user')
      .eq('is_read', false);
    
    if (error) {
      return 0;
    }
    
    return count || 0;
  }

  /**
   * Get last message in a conversation
   */
  async getLastMessage(conversationId: string): Promise<ConversationMessage | null> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as ConversationMessage;
  }

  /**
   * Update conversation status
   */
  async updateStatus(conversationId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<void> {
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    if (error) {
      logger.error({ err: error }, `Failed to update conversation status ${conversationId}`);
      throw new Error('Failed to update conversation status');
    }
  }

  /**
   * Auto-close conversations for completed or canceled orders
   */
  async autoCloseConversationsForOrder(orderId: string, orderStatus: string): Promise<void> {
    // Only auto-close for terminal statuses
    const terminalStatuses = ['delivered', 'suspended', 'refund_requested'];
    
    if (!terminalStatuses.includes(orderStatus)) {
      return;
    }

    const supabase = getSupabase();

    // Get all conversations for this order
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('order_id', orderId)
      .neq('status', 'closed');

    if (fetchError || !conversations || conversations.length === 0) {
      return;
    }

    // Close all open conversations
    for (const conversation of conversations) {
      try {
        await this.updateStatus(conversation.id, 'closed');
        
        // Add system message about auto-closure
        await this.addMessage(conversation.id, {
          sender_type: 'system',
          message: `This conversation has been automatically closed because the order status is now "${orderStatus}". If you need further assistance, please contact support.`,
          attachments: [],
        });

        logger.info(`Auto-closed conversation ${conversation.id} for order ${orderId} (status: ${orderStatus})`);
      } catch (error) {
        logger.error({ error }, `Failed to auto-close conversation ${conversation.id}`);
      }
    }
  }
}

export const conversationsService = new ConversationsService();
