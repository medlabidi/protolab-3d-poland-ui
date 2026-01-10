import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { verifyAccessToken, JWTPayload } from '../_lib/jwt';

interface User {
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status?: string;
  email_verified?: boolean;
  phone?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  let decoded: JWTPayload;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if user is admin
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const supabase = getSupabase();

  try {
    // GET: Fetch all users
    if (req.method === 'GET') {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ users });
    }

    // POST: Create new user
    if (req.method === 'POST') {
      const userData: User = req.body;

      // Validate required fields
      if (!userData.name || !userData.email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      const newUser = {
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
        status: userData.status || 'pending',
        email_verified: userData.email_verified || false,
        phone: userData.phone,
        country: userData.country,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ user: data });
    }

    // PATCH: Update user
    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Don't allow updating certain fields
      delete (updates as any).id;
      delete (updates as any).created_at;

      // Add updated_at timestamp
      (updates as any).updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user: data });
    }

    // DELETE: Delete user
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Prevent admin from deleting themselves
      if (id === decoded.userId) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
