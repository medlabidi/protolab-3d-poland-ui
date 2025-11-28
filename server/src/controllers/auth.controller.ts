import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, message } = await authService.register(req.body);
      
      logger.info(`User registered (email verification required): ${user.email}`);
      
      res.status(201).json({
        success: true,
        message,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({ success: false, error: 'Verification token is required' });
        return;
      }
      
      const { user, tokens } = await authService.verifyEmail(token);
      
      logger.info(`Email verified for user: ${user.email}`);
      
      // Return JSON response with tokens
      res.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
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
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
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
        res.status(400).json({ success: false, error: 'Refresh token required' });
        return;
      }
      
      const tokens = await authService.refresh(refreshToken);
      
      res.json({ success: true, tokens });
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
      
      res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { googleToken } = req.body;
      
      if (!googleToken) {
        res.status(400).json({ success: false, error: 'Google token required' });
        return;
      }
      
      const { user, tokens } = await authService.googleAuth(googleToken);
      
      logger.info(`User authenticated via Google: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Google authentication successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
