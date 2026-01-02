import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

export interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_response?: string;
  admin_id?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export class SupportService {
  /**
   * Create a new support message
   */
  async createSupportMessage(
    userId: string,
    subject: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<SupportMessage> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: userId,
        subject,
        message,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support message: ${error.message}`);
    }

    // Send automatic reply
    await this.sendAutoReply(data.id, userId);

    logger.info(`Support message created: ${data.id}`);
    return data;
  }

  /**
   * Send automatic reply when support message is created
   */
  private async sendAutoReply(messageId: string, userId: string): Promise<void> {
    const supabase = getSupabase();

    const autoReplyMessage = `Thank you for contacting ProtoLab 3D Poland support. We have received your message and will respond within 24 hours. 

Your support ticket ID is: ${messageId.substring(0, 8)}

For urgent matters, you can also reach us at support@protolab3d.pl.

Best regards,
ProtoLab 3D Poland Team`;

    try {
      await supabase.from('support_messages').update({
        admin_response: autoReplyMessage,
        responded_at: new Date().toISOString(),
      }).eq('id', messageId);

      logger.info(`Auto-reply sent for support message: ${messageId}`);
    } catch (error) {
      logger.error({ error }, `Failed to send auto-reply for message: ${messageId}`);
    }
  }

  /**
   * Get all support messages (admin)
   */
  async getAllSupportMessages(): Promise<SupportMessage[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get support messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's support messages
   */
  async getUserSupportMessages(userId: string): Promise<SupportMessage[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user support messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get single support message
   */
  async getSupportMessageById(messageId: string): Promise<SupportMessage | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .select('*, users(name, email)')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get support message: ${error.message}`);
    }

    return data;
  }

  /**
   * Update support message status (admin)
   */
  async updateSupportMessageStatus(
    messageId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<SupportMessage> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update support message status: ${error.message}`);
    }

    logger.info(`Support message status updated: ${messageId} -> ${status}`);
    return data;
  }

  /**
   * Admin responds to support message
   */
  async respondToSupportMessage(
    messageId: string,
    adminId: string,
    response: string
  ): Promise<SupportMessage> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('support_messages')
      .update({
        admin_response: response,
        admin_id: adminId,
        responded_at: new Date().toISOString(),
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to respond to support message: ${error.message}`);
    }

    logger.info(`Admin responded to support message: ${messageId}`);
    return data;
  }
}

export const supportService = new SupportService();
