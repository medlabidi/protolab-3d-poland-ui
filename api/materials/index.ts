import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { verifyAccessToken, JWTPayload } from '../_lib/jwt';

interface Material {
  id?: string;
  name: string;
  type: string;
  color: string;
  price_per_kg: number;
  density?: number;
  stock_quantity?: number;
  print_temp?: number;
  bed_temp?: number;
  supplier?: string;
  last_restocked?: string;
  reorder_point?: number;
  is_active?: boolean;
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
        // Get all materials
        const { data: materials, error } = await supabase
          .from('materials')
          .select('*')
          .order('type', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching materials:', error);
          return res.status(500).json({ error: 'Failed to fetch materials' });
        }

        return res.status(200).json({ materials: materials || [] });
      }

      case 'POST': {
        // Create new material
        const materialData: Material = req.body;

        if (!materialData.name || !materialData.type || !materialData.price_per_kg) {
          return res.status(400).json({ error: 'Material name, type, and price are required' });
        }

        const { data: newMaterial, error } = await supabase
          .from('materials')
          .insert([{
            ...materialData,
            is_active: materialData.is_active !== undefined ? materialData.is_active : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating material:', error);
          return res.status(500).json({ error: 'Failed to create material' });
        }

        return res.status(201).json({ material: newMaterial });
      }

      case 'PUT':
      case 'PATCH': {
        // Update material
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Material ID is required' });
        }

        const { data: updatedMaterial, error } = await supabase
          .from('materials')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating material:', error);
          return res.status(500).json({ error: 'Failed to update material' });
        }

        return res.status(200).json({ material: updatedMaterial });
      }

      case 'DELETE': {
        // Delete material (soft delete by setting is_active to false)
        const materialId = req.query.id || req.body.id;

        if (!materialId) {
          return res.status(400).json({ error: 'Material ID is required' });
        }

        const { error } = await supabase
          .from('materials')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', materialId);

        if (error) {
          console.error('Error deleting material:', error);
          return res.status(500).json({ error: 'Failed to delete material' });
        }

        return res.status(200).json({ message: 'Material deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in materials API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
