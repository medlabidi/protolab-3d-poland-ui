import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../../server/src/controllers/auth.controller';
import { authService } from '../../server/src/services/auth.service';

const authController = new AuthController();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, tokens } = await authService.login(email, password);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
