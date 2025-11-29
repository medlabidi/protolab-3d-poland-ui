import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '../utils/validators';
import rateLimit from 'express-rate-limit';

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased from 5 to 20 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard auth endpoints
router.post('/register', validate(registerSchema), asyncHandler((req: Request, res: Response, next: NextFunction) => authController.register(req, res, next)));
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler((req: Request, res: Response, next: NextFunction) => authController.login(req, res, next)));
router.post('/refresh', asyncHandler((req: Request, res: Response, next: NextFunction) => authController.refresh(req, res, next)));
router.post('/logout', asyncHandler((req: Request, res: Response, next: NextFunction) => authController.logout(req, res, next)));

// Email verification
router.get('/verify-email', asyncHandler((req: Request, res: Response, next: NextFunction) => authController.verifyEmail(req, res, next)));

// Profile update (protected route)
router.put('/profile', authenticate, asyncHandler((req: Request, res: Response, next: NextFunction) => authController.updateProfile(req, res, next)));

// Change password (protected route)
router.post('/change-password', authenticate, asyncHandler((req: Request, res: Response, next: NextFunction) => authController.changePassword(req, res, next)));

// Google OAuth callback
router.post('/google', asyncHandler((req: Request, res: Response, next: NextFunction) => authController.googleCallback(req, res, next)));

export default router;
