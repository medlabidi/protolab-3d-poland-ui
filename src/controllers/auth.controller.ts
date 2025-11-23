import { Request, Response, NextFunction } from 'express';
import { authService } from "@/services/auth.service";
import { logger } from "@/config/logger";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, message } = await authService.register(req.body);
      
      logger.info(`User registered (pending approval): ${user.email}`);
      
      res.status(201).json({
        message,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: 'pending',
        },
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
  
  async approveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Approval token required' });
        return;
      }
      
      const result = await authService.approveUser(token);
      
      logger.info(`User approved with token: ${token.substring(0, 10)}...`);
      
      // Return HTML response for better UX when admin clicks email link
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Approved - ProtoLab 3D Poland</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .success-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #4CAF50; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>User Approved Successfully!</h1>
            <p>${result.message}</p>
            <p>The user has been notified via email and can now log in to their account.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }

  async rejectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;
      const { reason } = req.body;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Approval token required' });
        return;
      }
      
      const result = await authService.rejectUser(token, reason);
      
      logger.info(`User rejected with token: ${token.substring(0, 10)}...`);
      
      // Return HTML response for better UX when admin clicks email link
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Rejected - ProtoLab 3D Poland</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #f44336; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>User Registration Rejected</h1>
            <p>${result.message}</p>
            <p>The user has been notified via email.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
