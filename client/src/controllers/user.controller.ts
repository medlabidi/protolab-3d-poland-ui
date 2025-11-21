import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { userService } from '../services/user.service';
import { logger } from '../config/logger';

export class UserController {
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.user!.id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
  
  async updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUser(req.user!.id, req.body);
      
      logger.info(`User updated: ${user.email}`);
      
      res.json({ message: 'User updated successfully', user });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.user!.id);
      
      logger.info(`User deleted: ${req.user!.email}`);
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      res.json({ users, count: users.length });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      
      logger.info(`User deleted by admin: ${id}`);
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();