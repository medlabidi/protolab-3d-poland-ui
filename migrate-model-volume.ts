import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add model_volume_cm3 column...');
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);
        
        COMMENT ON COLUMN orders.model_volume_cm3 IS 'Base 3D model volume in cm³, used for exact price recalculation when editing orders';
      `
    });
    
    if (error) {
      // Try alternative method - direct query
      console.log('Trying alternative method...');
      const { error: altError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      if (altError) {
        throw altError;
      }
      
      console.log('⚠️  Could not run migration automatically.');
      console.log('📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:');
      console.log('');
      console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);');
      console.log('');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('   Added model_volume_cm3 column to orders table');
    
  } catch (err: any) {
    console.error('❌ Error running migration:', err.message);
    console.log('');
    console.log('📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);');
    console.log('');
    process.exit(1);
  }
}

runMigration();
