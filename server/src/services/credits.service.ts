import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'refund_bonus' | 'order_payment' | 'admin_adjustment';
  description?: string;
  order_id?: string;
  balance_after: number;
  created_at: string;
}

export class CreditsService {
  /**
   * Get or create credit balance for a user
   */
  async getBalance(userId: string): Promise<number> {
    const supabase = getSupabase();
    
    // Try to get existing balance
    const { data, error } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, create one with 0 balance
        const { data: newCredit, error: createError } = await supabase
          .from('credits')
          .insert([{ user_id: userId, balance: 0 }])
          .select('balance')
          .single();
        
        if (createError) {
          logger.error({ err: createError }, `Failed to create credits for user ${userId}`);
          return 0;
        }
        return newCredit?.balance || 0;
      }
      logger.error({ err: error }, `Failed to get credits for user ${userId}`);
      return 0;
    }
    
    return data?.balance || 0;
  }

  /**
   * Add credits to user's balance (purchase or refund bonus)
   */
  async addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'refund_bonus' | 'admin_adjustment',
    description?: string,
    orderId?: string
  ): Promise<{ balance: number; transaction: CreditTransaction }> {
    const supabase = getSupabase();
    
    // Get current balance
    let currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;
    
    // Update balance
    const { error: updateError } = await supabase
      .from('credits')
      .upsert([{ 
        user_id: userId, 
        balance: newBalance,
        updated_at: new Date().toISOString()
      }], { onConflict: 'user_id' });
    
    if (updateError) {
      logger.error({ err: updateError }, `Failed to update credits for user ${userId}`);
      throw new Error('Failed to add credits');
    }
    
    // Log transaction
    const { data: transaction, error: txError } = await supabase
      .from('credits_transactions')
      .insert([{
        user_id: userId,
        amount: amount,
        type: type,
        description: description || `Added ${amount.toFixed(2)} PLN credits`,
        order_id: orderId || null,
        balance_after: newBalance
      }])
      .select()
      .single();
    
    if (txError) {
      logger.error({ err: txError }, `Failed to log credit transaction for user ${userId}`);
    }
    
    logger.info(`Added ${amount} credits to user ${userId}. New balance: ${newBalance}`);
    
    return { balance: newBalance, transaction: transaction as CreditTransaction };
  }

  /**
   * Use credits for an order payment
   */
  async useCredits(
    userId: string,
    amount: number,
    orderId: string,
    description?: string
  ): Promise<{ balance: number; transaction: CreditTransaction }> {
    const supabase = getSupabase();
    
    // Get current balance
    const currentBalance = await this.getBalance(userId);
    
    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }
    
    const newBalance = currentBalance - amount;
    
    // Update balance
    const { error: updateError } = await supabase
      .from('credits')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      logger.error({ err: updateError }, `Failed to deduct credits for user ${userId}`);
      throw new Error('Failed to use credits');
    }
    
    // Log transaction
    const { data: transaction, error: txError } = await supabase
      .from('credits_transactions')
      .insert([{
        user_id: userId,
        amount: -amount, // Negative for deduction
        type: 'order_payment',
        description: description || `Used ${amount.toFixed(2)} PLN for order`,
        order_id: orderId,
        balance_after: newBalance
      }])
      .select()
      .single();
    
    if (txError) {
      logger.error({ err: txError }, `Failed to log credit transaction for user ${userId}`);
    }
    
    logger.info(`Used ${amount} credits from user ${userId} for order ${orderId}. New balance: ${newBalance}`);
    
    return { balance: newBalance, transaction: transaction as CreditTransaction };
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('credits_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error({ err: error }, `Failed to get transaction history for user ${userId}`);
      return [];
    }
    
    return data as CreditTransaction[];
  }

  /**
   * Get credit packages available for purchase
   */
  getCreditPackages(): { id: string; amount: number; price: number; bonus: number; popular?: boolean }[] {
    return [
      { id: 'pack_50', amount: 50, price: 50, bonus: 0 },
      { id: 'pack_100', amount: 110, price: 100, bonus: 10, popular: true },
      { id: 'pack_200', amount: 230, price: 200, bonus: 30 },
      { id: 'pack_500', amount: 600, price: 500, bonus: 100 },
    ];
  }
}

export const creditsService = new CreditsService();
