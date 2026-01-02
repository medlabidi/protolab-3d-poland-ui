import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting PayU fields migration...\n');

  try {
    // Check if columns already exist
    console.log('📋 Checking existing schema...');
    
    const { data: ordersColumns, error: ordersError } = await supabase
      .from('orders')
      .select('payu_order_id, payment_status')
      .limit(1);

    if (!ordersError) {
      console.log('✅ PayU columns already exist in orders table');
    } else {
      console.log('⚠️  PayU columns might not exist in orders table');
      console.log('   Error:', ordersError.message);
    }

    const { data: creditsColumns, error: creditsError } = await supabase
      .from('credits_transactions')
      .select('payu_order_id')
      .limit(1);

    if (!creditsError) {
      console.log('✅ PayU column already exists in credits_transactions table');
    } else {
      console.log('⚠️  PayU column might not exist in credits_transactions table');
      console.log('   Error:', creditsError.message);
    }

    console.log('\n📝 Migration SQL to run manually in Supabase SQL Editor:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
-- Add PayU integration fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payu_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create index for faster PayU order lookups
CREATE INDEX IF NOT EXISTS idx_orders_payu_order_id ON public.orders(payu_order_id);

-- Add PayU transaction ID to credits_transactions table
ALTER TABLE public.credits_transactions
ADD COLUMN IF NOT EXISTS payu_order_id TEXT;

-- Create index for credits transactions PayU lookups
CREATE INDEX IF NOT EXISTS idx_credits_transactions_payu_order_id ON public.credits_transactions(payu_order_id);

-- Add comments
COMMENT ON COLUMN public.orders.payu_order_id IS 'PayU order ID returned from payment gateway';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, completed, failed, canceled';
COMMENT ON COLUMN public.credits_transactions.payu_order_id IS 'PayU order ID for credit purchase transactions';
    `);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('📋 Manual Migration Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log(`2. Select your project (${supabaseUrl})`);
    console.log('3. Click on "SQL Editor" in the left sidebar');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the SQL above');
    console.log('6. Click "Run" to execute the migration');
    console.log('7. Verify the columns were added successfully\n');

    console.log('✅ Migration preparation complete!');
    console.log('   Run the SQL manually in Supabase dashboard to complete the migration.');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    console.log('\nℹ️  You can still run the SQL manually in Supabase SQL Editor.');
  }
}

runMigration();
