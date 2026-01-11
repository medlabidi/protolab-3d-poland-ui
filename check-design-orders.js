const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDesignOrders() {
  console.log('🔍 Checking for design orders...\n');
  
  // Get all orders with order_type
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, order_type, file_name, design_description, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Total orders: ${orders.length}`);
  
  const printOrders = orders.filter(o => o.order_type === 'print');
  const designOrders = orders.filter(o => o.order_type === 'design');
  const nullTypeOrders = orders.filter(o => !o.order_type);
  
  console.log(`🖨️  Print orders: ${printOrders.length}`);
  console.log(`🎨 Design orders: ${designOrders.length}`);
  console.log(`❓ Orders without type: ${nullTypeOrders.length}\n`);
  
  if (designOrders.length > 0) {
    console.log('✅ Found design orders:');
    designOrders.forEach(order => {
      console.log(`  - ${order.order_number}: ${order.file_name || order.design_description || 'No description'}`);
    });
  } else {
    console.log('⚠️  No design orders found!');
    console.log('\n💡 Sample orders:');
    orders.slice(0, 5).forEach(order => {
      console.log(`  - ${order.order_number}: type="${order.order_type}", file="${order.file_name}"`);
    });
  }
}

checkDesignOrders().then(() => process.exit(0));
