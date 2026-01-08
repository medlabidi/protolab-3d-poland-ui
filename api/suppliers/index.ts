import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { verifyAccessToken, JWTPayload } from '../_lib/jwt';

interface Supplier {
  id?: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  materials_supplied?: string[];
  payment_terms?: string;
  delivery_time?: string;
  notes?: string;
  rating?: number;
  total_orders?: number;
  active?: boolean;
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
        // Get all suppliers
        const { data: suppliers, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching suppliers:', error);
          return res.status(500).json({ error: 'Failed to fetch suppliers' });
        }

        return res.status(200).json({ suppliers: suppliers || [] });
      }

      case 'POST': {
        // Create new supplier
        const supplierData: Supplier = req.body;

        if (!supplierData.name) {
          return res.status(400).json({ error: 'Supplier name is required' });
        }

        const { data: newSupplier, error } = await supabase
          .from('suppliers')
          .insert([{
            ...supplierData,
            active: supplierData.active !== undefined ? supplierData.active : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating supplier:', error);
          return res.status(500).json({ error: 'Failed to create supplier' });
        }

        return res.status(201).json({ supplier: newSupplier });
      }

      case 'PUT':
      case 'PATCH': {
        // Update supplier
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Supplier ID is required' });
        }

        const { data: updatedSupplier, error } = await supabase
          .from('suppliers')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating supplier:', error);
          return res.status(500).json({ error: 'Failed to update supplier' });
        }

        return res.status(200).json({ supplier: updatedSupplier });
      }

      case 'DELETE': {
        // Delete supplier (soft delete by setting active to false)
        const supplierId = req.query.id || req.body.id;

        if (!supplierId) {
          return res.status(400).json({ error: 'Supplier ID is required' });
        }

        const { error } = await supabase
          .from('suppliers')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', supplierId);

        if (error) {
          console.error('Error deleting supplier:', error);
          return res.status(500).json({ error: 'Failed to delete supplier' });
        }

        return res.status(200).json({ message: 'Supplier deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in suppliers API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
