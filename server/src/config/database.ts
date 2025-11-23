import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

let supabase: SupabaseClient | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Validate connection credentials
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
      throw new Error('Supabase credentials not properly configured');
    }
    
    logger.info('Connecting to Supabase...');
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Test the connection with a simple query
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet, which is okay
      throw error;
    }
    
    logger.info('✅ Supabase connected successfully');
    logger.info({ url: supabaseUrl }, 'Database connection established');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, '❌ Supabase connection failed');
    
    // Provide specific error guidance
    if (errorMessage.includes('Invalid API key')) {
      logger.error('Authentication error: Verify SUPABASE_SERVICE_ROLE_KEY');
    } else if (errorMessage.includes('fetch')) {
      logger.error('Network error: Check internet connection and SUPABASE_URL');
    }
    
    throw error;
  }
};

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Call connectDatabase() first.');
  }
  return supabase;
};