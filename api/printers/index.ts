import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { verifyAccessToken, JWTPayload } from '../_lib/jwt';

interface Printer {
  id?: string;
  name: string;
  model?: string;
  status: 'online' | 'offline' | 'maintenance';
  current_job?: string;
  progress?: number;
  temperature?: number;
  bed_temp?: number;
  uptime?: string;
  total_prints?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  maintenance_cost_monthly?: number;
  maintenance_interval_days?: number;
  maintenance_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabase();
  const authHeader = req.headers.authorization;

  // Verify admin authentication
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let user: JWTPayload;
  
  try {
    user = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();

  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        // Get all printers
        const { data: printers, error } = await supabase
          .from('printers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching printers:', error);
          return res.status(500).json({ error: 'Failed to fetch printers' });
        }

        return res.status(200).json({ printers: printers || [] });
      }

      case 'POST': {
        // Create new printer
        const printerData: Printer = req.body;

        if (!printerData.name) {
          return res.status(400).json({ error: 'Printer name is required' });
        }

        const { data: newPrinter, error } = await supabase
          .from('printers')
          .insert([{
            ...printerData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating printer:', error);
          return res.status(500).json({ error: 'Failed to create printer' });
        }

        return res.status(201).json({ printer: newPrinter });
      }

      case 'PUT':
      case 'PATCH': {
        // Update printer
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Printer ID is required' });
        }

        const { data: updatedPrinter, error } = await supabase
          .from('printers')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating printer:', error);
          return res.status(500).json({ error: 'Failed to update printer' });
        }

        return res.status(200).json({ printer: updatedPrinter });
      }

      case 'DELETE': {
        // Delete printer
        const printerId = req.query.id || req.body.id;

        if (!printerId) {
          return res.status(400).json({ error: 'Printer ID is required' });
        }

        const { error } = await supabase
          .from('printers')
          .delete()
          .eq('id', printerId);

        if (error) {
          console.error('Error deleting printer:', error);
          return res.status(500).json({ error: 'Failed to delete printer' });
        }

        return res.status(200).json({ message: 'Printer deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in printers API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
