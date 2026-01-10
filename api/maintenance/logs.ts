/**
 * Vercel Serverless Function: Printer Maintenance Logs API
 * Endpoint: /api/maintenance/logs
 * Methods: GET, POST
 * Description: Gestion des logs de maintenance
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

interface MaintenanceLog {
  printer_id: string;
  maintenance_date?: string;
  maintenance_type: 'routine' | 'repair' | 'upgrade' | 'emergency';
  cost: number;
  description?: string;
  parts_replaced?: string[];
  performed_by?: string;
  duration_minutes?: number;
  next_scheduled_date?: string;
  status?: 'completed' | 'scheduled' | 'in_progress' | 'cancelled';
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // GET: Récupérer les logs
    if (req.method === 'GET') {
      const { printer_id, limit = 50, maintenance_type, status } = req.query;

      let query = supabase
        .from('printer_maintenance_logs')
        .select(`
          *,
          printer:printers(id, name, model)
        `)
        .order('maintenance_date', { ascending: false })
        .limit(parseInt(limit));

      // Filtres optionnels
      if (printer_id) {
        query = query.eq('printer_id', printer_id);
      }
      if (maintenance_type) {
        query = query.eq('maintenance_type', maintenance_type);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch maintenance logs' });
      }

      return res.status(200).json({
        success: true,
        data: logs || [],
        count: logs?.length || 0,
        timestamp: new Date().toISOString(),
      });
    }

    // POST: Créer un nouveau log
    if (req.method === 'POST') {
      const logData: MaintenanceLog = req.body;

      // Validation
      if (!logData.printer_id || !logData.maintenance_type || logData.cost === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: printer_id, maintenance_type, cost' 
        });
      }

      // Vérifier que l'imprimante existe
      const { data: printer, error: printerError } = await supabase
        .from('printers')
        .select('id, name')
        .eq('id', logData.printer_id)
        .single();

      if (printerError || !printer) {
        return res.status(404).json({ error: 'Printer not found' });
      }

      // Insérer le log
      const { data: newLog, error: insertError } = await supabase
        .from('printer_maintenance_logs')
        .insert({
          printer_id: logData.printer_id,
          maintenance_date: logData.maintenance_date || new Date().toISOString(),
          maintenance_type: logData.maintenance_type,
          cost: logData.cost,
          description: logData.description,
          parts_replaced: logData.parts_replaced,
          performed_by: logData.performed_by,
          duration_minutes: logData.duration_minutes,
          next_scheduled_date: logData.next_scheduled_date,
          status: logData.status || 'completed',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create maintenance log' });
      }

      // Le trigger PostgreSQL mettra automatiquement à jour le printer.total_maintenance_cost

      return res.status(201).json({
        success: true,
        data: newLog,
        message: `Maintenance log created for printer: ${printer.name}`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
