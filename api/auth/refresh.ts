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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
