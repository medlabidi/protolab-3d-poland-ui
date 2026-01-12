const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Checking invoice-related columns...\n');
  
  try {
    // Test 1: Check if business_info column exists in users table
    console.log('Test 1: Checking users.business_info column...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_info')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error checking users table:', userError.message);
      console.log('⚠️  You need to run the migration in Supabase SQL Editor:');
      console.log('   SQL/add-business-info-to-users.sql\n');
    } else {
      console.log('✅ users.business_info column exists\n');
    }

    // Test 2: Check if invoice columns exist in orders table
    console.log('Test 2: Checking orders invoice columns...');
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('invoice_required, invoice_business_info, invoice_generated_at, invoice_pdf_url')
      .limit(1);
    
    if (orderError) {
      console.error('❌ Error checking orders table:', orderError.message);
      console.log('⚠️  You need to run the migration in Supabase SQL Editor:');
      console.log('   SQL/add-invoice-columns-to-orders.sql\n');
    } else {
      console.log('✅ orders invoice columns exist\n');
    }

    console.log('📝 Migration Instructions:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL files:');
    console.log('   - SQL/add-business-info-to-users.sql');
    console.log('   - SQL/add-invoice-columns-to-orders.sql\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
