import { getSupabase } from '../config/database';

export interface IRefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export type CreateRefreshTokenData = Omit<IRefreshToken, 'id' | 'created_at'>;

export class RefreshToken {
  static async create(data: CreateRefreshTokenData): Promise<IRefreshToken> {
    const supabase = getSupabase();
    const { data: token, error } = await supabase
      .from('refresh_tokens')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create refresh token: ${error.message}`);
    return token;
  }

  static async findOne(filter: Partial<Pick<IRefreshToken, 'token' | 'user_id'>>): Promise<IRefreshToken | null> {
    const supabase = getSupabase();
    let query = supabase.from('refresh_tokens').select('*');
    
    if (filter.token) {
      query = query.eq('token', filter.token);
    }
    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to find refresh token: ${error.message}`);
    }
    
    return data;
  }

  static async deleteOne(filter: Partial<Pick<IRefreshToken, 'token' | 'user_id'>>): Promise<void> {
    const supabase = getSupabase();
    let query = supabase.from('refresh_tokens').delete();
    
    if (filter.token) {
      query = query.eq('token', filter.token);
    }
    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }
    
    const { error } = await query;
    
    if (error) throw new Error(`Failed to delete refresh token: ${error.message}`);
  }

  static async deleteExpired(): Promise<void> {
    const supabase = getSupabase();
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', now);
    
    if (error) throw new Error(`Failed to delete expired tokens: ${error.message}`);
  }
}
