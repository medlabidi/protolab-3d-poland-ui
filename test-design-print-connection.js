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

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Database Connection for Design Service and Print Jobs\n');
console.log('=' .repeat(80));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Present' : '✗ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓ Present (length: ' + (supabaseKey?.length || 0) + ')' : '✗ Missing');
  
  if (!supabaseKey) {
    console.log('\n💡 Check .env.production file for SUPABASE_SERVICE_ROLE_KEY');
  }
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n📊 Database Connection Test\n');
  
  try {
    // 1. Check if order_type column exists
    console.log('1️⃣  Checking orders table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (columnError) {
      console.error('   ❌ Error accessing orders table:', columnError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      const hasOrderType = 'order_type' in columns[0];
      console.log(`   ${hasOrderType ? '✅' : '❌'} order_type column ${hasOrderType ? 'exists' : 'MISSING'}`);
      
      if (!hasOrderType) {
        console.log('   ⚠️  WARNING: order_type column is missing! Run migration first.');
        console.log('   📝 Run: node run-migration.js or execute SQL/migration-design-assistance.sql');
      }
    }
    
    // 2. Get all orders and their types
    console.log('\n2️⃣  Fetching all orders...');
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_type, file_name, status, created_at')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('   ❌ Error fetching orders:', ordersError.message);
      return;
    }
    
    console.log(`   ✅ Total orders in database: ${allOrders.length}`);
    
    // 3. Categorize orders
    const printOrders = allOrders.filter(o => o.order_type === 'print');
    const designOrders = allOrders.filter(o => o.order_type === 'design');
    const nullOrders = allOrders.filter(o => !o.order_type);
    const otherOrders = allOrders.filter(o => o.order_type && o.order_type !== 'print' && o.order_type !== 'design');
    
    console.log('\n3️⃣  Order Type Distribution:');
    console.log(`   🖨️  Print orders (order_type='print'): ${printOrders.length}`);
    console.log(`   🎨 Design orders (order_type='design'): ${designOrders.length}`);
    console.log(`   ❓ Orders with NULL type: ${nullOrders.length}`);
    if (otherOrders.length > 0) {
      console.log(`   ⚠️  Orders with other types: ${otherOrders.length}`);
    }
    
    // 4. Show sample print orders
    if (printOrders.length > 0) {
      console.log('\n4️⃣  Sample Print Orders (showing first 5):');
      printOrders.slice(0, 5).forEach((order, idx) => {
        console.log(`   ${idx + 1}. ${order.id.substring(0, 8)} - ${order.file_name || 'No file'} - ${order.status}`);
      });
    } else {
      console.log('\n4️⃣  ⚠️  No print orders found!');
    }
    
    // 5. Show sample design orders
    if (designOrders.length > 0) {
      console.log('\n5️⃣  Sample Design Orders (showing first 5):');
      designOrders.slice(0, 5).forEach((order, idx) => {
        const desc = order.file_name || 'No description';
        console.log(`   ${idx + 1}. ${order.id.substring(0, 8)} - ${desc.substring(0, 50)} - ${order.status}`);
      });
    } else {
      console.log('\n5️⃣  ⚠️  No design orders found!');
    }
    
    // 6. Show NULL type orders (need to be migrated)
    if (nullOrders.length > 0) {
      console.log('\n6️⃣  ⚠️  Orders with NULL order_type (need migration):');
      console.log(`   Found ${nullOrders.length} orders without order_type`);
      console.log('   Sample of first 5:');
      nullOrders.slice(0, 5).forEach((order, idx) => {
        console.log(`   ${idx + 1}. ${order.id.substring(0, 8)} - ${order.file_name || 'No file'}`);
      });
      console.log('\n   💡 To fix: Update these orders with order_type="print" (default)');
    }
    
    // 7. Test API-like queries
    console.log('\n7️⃣  Testing API-style queries:');
    
    // Test print query
    const { data: printQuery, error: printError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'print')
      .order('created_at', { ascending: false });
    
    if (printError) {
      console.error('   ❌ Print query error:', printError.message);
    } else {
      console.log(`   ✅ Print query (?type=print): Found ${printQuery.length} orders`);
    }
    
    // Test design query
    const { data: designQuery, error: designError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'design')
      .order('created_at', { ascending: false });
    
    if (designError) {
      console.error('   ❌ Design query error:', designError.message);
    } else {
      console.log(`   ✅ Design query (?type=design): Found ${designQuery.length} orders`);
    }
    
    // 8. Summary and Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY & RECOMMENDATIONS:\n');
    
    if (printOrders.length === 0 && designOrders.length === 0 && nullOrders.length > 0) {
      console.log('⚠️  ACTION REQUIRED: All orders have NULL order_type!');
      console.log('   Run this SQL to fix:');
      console.log('   UPDATE orders SET order_type = \'print\' WHERE order_type IS NULL;');
    } else if (printOrders.length > 0 || designOrders.length > 0) {
      console.log('✅ Database is properly configured!');
      console.log(`   - ${printOrders.length} print orders ready`);
      console.log(`   - ${designOrders.length} design orders ready`);
      if (nullOrders.length > 0) {
        console.log(`   ⚠️  ${nullOrders.length} orders still need order_type assigned`);
      }
    } else {
      console.log('ℹ️  Database is empty or all orders have been deleted');
    }
    
    console.log('\n✅ Database check complete!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('\n❌ Fatal error during database check:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

checkDatabase().then(() => process.exit(0));
