const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read and parse .env.production
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?\s*$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/\\r\\n/g, '').replace(/\r/g, '').replace(/\n/g, '').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrderTypes() {
  console.log('🔧 Fixing NULL order_type values...\n');
  console.log('=' .repeat(80));
  
  // 1. Count NULL orders
  const { count: nullCount, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .is('order_type', null);
  
  if (countError) {
    console.error('❌ Error counting NULL orders:', countError.message);
    return;
  }
  
  console.log(`📊 Found ${nullCount} orders with NULL order_type\n`);
  
  if (nullCount === 0) {
    console.log('✅ No orders to fix! All orders have order_type set.');
    return;
  }
  
  // 2. Update all NULL orders to 'print' (default)
  console.log('🔄 Updating orders to order_type="print"...');
  const { data, error: updateError } = await supabase
    .from('orders')
    .update({ order_type: 'print' })
    .is('order_type', null)
    .select();
  
  if (updateError) {
    console.error('❌ Error updating orders:', updateError.message);
    return;
  }
  
  console.log(`✅ Successfully updated ${data?.length || 0} orders to order_type="print"\n`);
  
  // 3. Verify the fix
  console.log('🔍 Verifying update...');
  const { count: remainingNull, error: verifyError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .is('order_type', null);
  
  if (verifyError) {
    console.error('❌ Error verifying:', verifyError.message);
    return;
  }
  
  if (remainingNull === 0) {
    console.log('✅ Verification successful! No more NULL order_type values.\n');
  } else {
    console.log(`⚠️  Warning: Still ${remainingNull} orders with NULL order_type\n`);
  }
  
  // 4. Show final distribution
  const { data: printOrders, error: printError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('order_type', 'print');
  
  const { data: designOrders, error: designError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('order_type', 'design');
  
  console.log('=' .repeat(80));
  console.log('📊 Final Order Type Distribution:');
  console.log(`   🖨️  Print orders: ${printOrders?.length || 0}`);
  console.log(`   🎨 Design orders: ${designOrders?.length || 0}`);
  console.log(`   ❓ NULL orders: ${remainingNull}`);
  console.log('=' .repeat(80));
  console.log('\n✅ Migration complete!');
  console.log('💡 Now visit https://protolab.info/admin/orders/print-jobs to see all print orders');
}

fixOrderTypes().catch(console.error);
