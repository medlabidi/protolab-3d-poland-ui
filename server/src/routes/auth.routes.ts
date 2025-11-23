import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/validators';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Email verification endpoint
router.get('/verify-email', authController.verifyEmail);

// Admin approval endpoints (kept for backward compatibility, but not used in email verification flow)
router.get('/approve-user', authController.approveUser);
router.get('/reject-user', authController.rejectUser);

export default router;
