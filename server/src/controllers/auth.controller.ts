import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body);
      
      logger.info(`User registered: ${user.email}`);
      
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          zipCode: user.zipCode,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          role: user.role,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);
      
      logger.info(`User logged in: ${user.email}`);
      
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          zipCode: user.zipCode,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          role: user.role,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }
      
      const tokens = await authService.refresh(refreshToken);
      
      res.json({ tokens });
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
