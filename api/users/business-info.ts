import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getUserIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    // Verify custom JWT token (same as used throughout the app)
    const decoded = jwt.verify(token, jwtSecret) as any;
    return decoded.userId || decoded.id;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get user's saved business info
      const { data: user, error } = await supabase
        .from('users')
        .select('business_info')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!user?.business_info) {
        return res.status(200).json({ businessInfo: null });
      }

      return res.status(200).json({ 
        businessInfo: typeof user.business_info === 'string' 
          ? JSON.parse(user.business_info) 
          : user.business_info 
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Save business info
      const { company_name, nip, address, city, postal_code } = req.body;

      if (!company_name || !nip) {
        return res.status(400).json({ error: 'Company name and NIP are required' });
      }

      const businessInfo = {
        company_name,
        nip,
        address,
        city,
        postal_code,
      };

      const { error } = await supabase
        .from('users')
        .update({ 
          business_info: JSON.stringify(businessInfo),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return res.status(200).json({ 
        success: true, 
        businessInfo 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Business info error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
