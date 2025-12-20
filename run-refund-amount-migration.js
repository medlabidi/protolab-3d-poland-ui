const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running refund_amount column migration...\n');

  try {
    // Add refund_amount column
    console.log('Adding refund_amount column to orders table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add refund_amount column
        ALTER TABLE public.orders 
        ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);
      `
    });

    if (error) {
      // Try direct approach if RPC doesn't work
      console.log('RPC method not available, trying direct SQL execution...');
      
      // We'll use a workaround: try to select from the column to see if it exists
      const { error: checkError } = await supabase
        .from('orders')
        .select('refund_amount')
        .limit(1);

      if (checkError && checkError.message.includes('refund_amount')) {
        console.log('\n⚠️  Column does not exist. You need to run this SQL manually in Supabase SQL Editor:');
        console.log('\n' + '='.repeat(80));
        console.log(`
-- Add refund_amount column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'refund_amount';
        `);
        console.log('='.repeat(80) + '\n');
        
        console.log('📝 Steps to run manually:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run" or press Ctrl+Enter\n');
        
        process.exit(1);
      } else {
        console.log('✅ Column already exists or was added successfully!');
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }

    // Verify the column exists
    console.log('\nVerifying refund_amount column...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id, refund_amount')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      console.log('\n⚠️  The column might not exist. Please run the SQL manually (see above).');
      process.exit(1);
    }

    console.log('✅ Verification successful! The refund_amount column is working.\n');
    console.log('🎉 Migration completed successfully!\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(`
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);
    `);
    console.log('='.repeat(80) + '\n');
    process.exit(1);
  }
}

runMigration();
