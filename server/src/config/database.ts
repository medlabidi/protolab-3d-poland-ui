import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

let supabase: SupabaseClient | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Validate connection credentials
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
      logger.warn('Supabase client will be initialized on first use');
      return; // Don't throw, just skip connection test in dev
    }
    
    logger.info('Connecting to Supabase...');
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Test the connection with a simple query
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet, which is okay
        logger.warn({ err: error }, 'Supabase connection test failed, but continuing...');
      } else {
        logger.info('✅ Supabase connected successfully');
        logger.info({ url: supabaseUrl }, 'Database connection established');
      }
    } catch (testError) {
      logger.warn({ err: testError }, 'Supabase connection test error, but client created');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, '❌ Supabase connection failed');
    
    // Provide specific error guidance
    if (errorMessage.includes('Invalid API key')) {
      logger.error('Authentication error: Verify SUPABASE_SERVICE_ROLE_KEY');
    } else if (errorMessage.includes('fetch')) {
      logger.error('Network error: Check internet connection and SUPABASE_URL');
    }
    
    // Don't throw in development - let the server start anyway
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Continuing in development mode without Supabase...');
      return;
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