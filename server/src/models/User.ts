import { getSupabase } from '../config/database';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role: 'user' | 'admin';
  email_verified: boolean;
  verification_token?: string;
  verification_token_expires?: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_token?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export type CreateUserData = Omit<IUser, 'id' | 'created_at'>;
export type UpdateUserData = Partial<Omit<IUser, 'id' | 'created_at'>>;

export class User {
  static async create(data: CreateUserData): Promise<IUser> {
    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return user;
  }

  static async findOne(filter: Partial<Pick<IUser, 'email' | 'id'>>): Promise<IUser | null> {
    const supabase = getSupabase();
    let query = supabase.from('users').select('*');
    
    if (filter.email) {
      query = query.eq('email', filter.email);
    }
    if (filter.id) {
      query = query.eq('id', filter.id);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to find user: ${error.message}`);
    }
    
    return data;
  }

  static async findById(id: string): Promise<IUser | null> {
    return this.findOne({ id });
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  static async updateById(id: string, data: UpdateUserData): Promise<IUser> {
    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return user;
  }

  static async deleteById(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
  }

  static async find(filter: Partial<IUser> = {}): Promise<IUser[]> {
    const supabase = getSupabase();
    let query = supabase.from('users').select('*');
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to find users: ${error.message}`);
    return data || [];
  }
}