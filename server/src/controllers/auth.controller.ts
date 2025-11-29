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
          phone: user.phone,
          address: user.address,
          city: user.city,
          zip_code: user.zip_code,
          country: user.country,
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
          phone: user.phone,
          address: user.address,
          city: user.city,
          zip_code: user.zip_code,
          country: user.country,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, phone, address, city, zipCode, country } = req.body;
      
      const updatedUser = await authService.updateProfile(userId, {
        name,
        phone,
        address,
        city,
        zipCode,
        country,
      });

      logger.info(`Profile updated for user: ${updatedUser.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
          city: updatedUser.city,
          zip_code: updatedUser.zip_code,
          country: updatedUser.country,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters' });
        return;
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      logger.info(`Password changed for user: ${userId}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
