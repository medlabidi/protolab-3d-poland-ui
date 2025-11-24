import { Response } from 'express';
import { AuthRequest } from '../types';

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
};