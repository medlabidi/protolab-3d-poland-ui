import { User, IUser } from '../models/User';
import { Order } from '../models/Order';
import mongoose from 'mongoose';

export class UserService {
  async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId).select('-passwordHash');
  }
  
  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  async deleteUser(userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await Order.deleteMany({ userId }, { session });
      await User.findByIdAndDelete(userId, { session });
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  async getAllUsers(): Promise<IUser[]> {
    return await User.find().select('-passwordHash').sort({ createdAt: -1 });
  }
}

export const userService = new UserService();