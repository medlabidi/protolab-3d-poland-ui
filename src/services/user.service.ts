import { User, IUser } from '../models/User';
import { Order } from '../models/Order';
import { getSupabase } from '../config/database';

export class UserService {
  async getUserById(userId: string): Promise<Omit<IUser, 'password_hash'> | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    // Exclude password_hash from response
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  async updateUser(userId: string, updates: Partial<IUser>): Promise<Omit<IUser, 'password_hash'>> {
    // Remove fields that shouldn't be updated
    const { id, created_at, password_hash, ...allowedUpdates } = updates as any;
    
    const user = await User.updateById(userId, allowedUpdates);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  async deleteUser(userId: string): Promise<void> {
    const supabase = getSupabase();
    
    try {
      // Delete all user orders first
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', userId);
      
      if (ordersError) throw ordersError;
      
      // Delete user
      await User.deleteById(userId);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getAllUsers(): Promise<Omit<IUser, 'password_hash'>[]> {
    const users = await User.find();
    
    // Exclude password_hash from all users
    return users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}

export const userService = new UserService();