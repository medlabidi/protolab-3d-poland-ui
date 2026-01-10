/**
 * Vercel Serverless Function: Printer Maintenance Insights API
 * Endpoint: /api/maintenance/insights
 * Method: GET
 * Description: Récupère les insights de maintenance pour toutes les imprimantes actives
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

interface MaintenanceInsight {
  id: string;
  name: string;
  model: string | null;
  status: string;
  maintenance_cost_monthly: number;
  total_maintenance_cost: number;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  maintenance_interval_days: number;
  days_until_maintenance: number;
  total_maintenance_count: number;
  emergency_count: number;
  avg_maintenance_cost: number;
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the maintenance insights view
    const { data: insights, error } = await supabase
      .from('printer_maintenance_insights')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch maintenance insights' });
    }

    // Calculate aggregate statistics
    const totalMonthly = insights?.reduce((sum, i) => sum + (i.maintenance_cost_monthly || 0), 0) || 0;
    const totalAnnual = totalMonthly * 12;
    const totalCumulative = insights?.reduce((sum, i) => sum + (i.total_maintenance_cost || 0), 0) || 0;
    const avgMonthly = insights?.length ? totalMonthly / insights.length : 0;
    const overdueCount = insights?.filter(i => i.days_until_maintenance < 0).length || 0;
    const upcomingCount = insights?.filter(i => i.days_until_maintenance >= 0 && i.days_until_maintenance <= 14).length || 0;
    const totalMaintenances = insights?.reduce((sum, i) => sum + (i.total_maintenance_count || 0), 0) || 0;
    const totalEmergencies = insights?.reduce((sum, i) => sum + (i.emergency_count || 0), 0) || 0;
    const emergencyRate = totalMaintenances > 0 ? (totalEmergencies / totalMaintenances) * 100 : 0;

    // Response
    return res.status(200).json({
      success: true,
      data: {
        insights: insights || [],
        summary: {
          totalMonthly,
          totalAnnual,
          totalCumulative,
          avgMonthly,
          overdueCount,
          upcomingCount,
          totalMaintenances,
          totalEmergencies,
          emergencyRate: parseFloat(emergencyRate.toFixed(2)),
          printerCount: insights?.length || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
