import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../server/src/services/auth.service';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, message } = await authService.register(req.body);

    res.status(201).json({
      message,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: 'pending',
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
