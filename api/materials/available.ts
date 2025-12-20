import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';

interface Material {
  material_type: string;
  color: string;
  price_per_kg: number;
  stock_status: string;
  lead_time_days: number;
}

interface MaterialAvailability {
  material_type: string;
  color: string;
  available: boolean;
  price_per_kg: number;
  lead_time_days: number;
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('material_type', { ascending: true })
      .order('color', { ascending: true });

    if (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }

    // Transform to MaterialAvailability format
    const availability: MaterialAvailability[] = (materials || []).map((material: Material) => ({
      material_type: material.material_type,
      color: material.color,
      available: material.stock_status === 'available',
      price_per_kg: material.price_per_kg,
      lead_time_days: material.lead_time_days,
      message: material.stock_status !== 'available' 
        ? `Material is currently unavailable. Processing will take up to ${material.lead_time_days || 4} business days.`
        : undefined
    }));

    return res.status(200).json({ materials: availability });
  } catch (error: any) {
    console.error('Materials API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch materials',
      details: error.message 
    });
  }
}
