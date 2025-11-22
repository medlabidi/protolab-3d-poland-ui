import { Request, Response } from 'express';
import { registerUser, loginUser, findOrCreateGoogleUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

// POST /auth/register
export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password, and name required' });
      return;
    }

    const result = await registerUser(email, password, name);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// POST /auth/login
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password required' });
      return;
    }

    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

// POST /auth/google-callback
export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  try {
    const { googleId, email, name } = req.body;

    if (!googleId || !email || !name) {
      res.status(400).json({ error: 'googleId, email, and name required' });
      return;
    }

    const result = await findOrCreateGoogleUser(googleId, email, name);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /auth/me (verify current user)
export async function handleGetMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.status(200).json({
    user: {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
    },
  });
}

// POST /auth/logout
export async function handleLogout(req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: 'Logged out successfully' });
}
