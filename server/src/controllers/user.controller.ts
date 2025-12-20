import { Response } from 'express';
import { AuthRequest } from '../types';
import { getSupabase } from '../config/database';

export const userController = {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.json({ userId, message: 'User profile' });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.json({ userId, message: 'Current user' });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.json({ userId, updated: true });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.json({ userId, updated: true });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async deleteMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminRole = req.user?.role;
      if (adminRole !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json({ users: [] });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminRole = req.user?.role;
      if (adminRole !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { id } = req.params;
      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const supabase = getSupabase();
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ notifications: notifications || [] });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },

  async markNotificationRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  },
};