import { Router } from 'express';
import {
  handleRegister,
  handleLogin,
  handleGoogleCallback,
  handleGetMe,
  handleLogout,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /auth/register
router.post('/register', handleRegister);

// POST /auth/login
router.post('/login', handleLogin);

// POST /auth/google-callback
router.post('/google-callback', handleGoogleCallback);

// GET /auth/me
router.get('/me', authenticateToken, handleGetMe);

// POST /auth/logout
router.post('/logout', handleLogout);

export default router;
