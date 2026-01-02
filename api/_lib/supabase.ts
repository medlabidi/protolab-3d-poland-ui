import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    let supabaseUrl = process.env.SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Clean up potential quotes or whitespace
    if (supabaseUrl) {
      supabaseUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '');
    }
    if (supabaseKey) {
      supabaseKey = supabaseKey.trim().replace(/^["']|["']$/g, '');
    }
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing env vars - SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseKey}`);
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl.substring(0, 20)}...`);
    }
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabase;
};
