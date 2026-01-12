const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use Vercel environment variables directly
const supabaseUrl = 'https://hgniwcwthjuefwtflufr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnbml3Y3d0aGp1ZWZ3dGZsdWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODU3NTA1NSwiZXhwIjoyMDQ0MTUxMDU1fQ.9HM04x5Z_W7zFPJNlBxkjjzWOQBcOF-nTRvCvxcWGE4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdvancedSettings() {
  console.log('\n🔍 Checking Advanced Settings in Database...\n');

  // Get the most recent orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, file_name, created_at, advanced_mode, layer_height, infill, support_type, infill_pattern, custom_layer_height, custom_infill')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching orders:', error);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('No orders found');
    return;
  }

  console.log('📦 Last 10 Orders:\n');
  
  orders.forEach((order, index) => {
    console.log(`${index + 1}. Order ID: ${order.id.substring(0, 8)}...`);
    console.log(`   File: ${order.file_name}`);
    console.log(`   Created: ${order.created_at}`);
    console.log(`   Advanced Mode: ${order.advanced_mode ? '✅ YES' : '❌ NO'}`);
    console.log(`   Layer Height: ${order.layer_height}mm`);
    console.log(`   Infill: ${order.infill}%`);
    console.log(`   Support Type: ${order.support_type || 'not set'}`);
    console.log(`   Infill Pattern: ${order.infill_pattern || 'not set'}`);
    console.log(`   Custom Layer Height: ${order.custom_layer_height || 'not set'}`);
    console.log(`   Custom Infill: ${order.custom_infill || 'not set'}`);
    console.log('');
  });

  // Check if advanced_mode column exists and has any true values
  const { data: advancedOrders } = await supabase
    .from('orders')
    .select('id, file_name, advanced_mode')
    .eq('advanced_mode', true)
    .limit(5);

  console.log(`\n📊 Summary:`);
  console.log(`   Total orders checked: ${orders.length}`);
  console.log(`   Orders with advanced_mode = true: ${advancedOrders?.length || 0}`);
  
  if (advancedOrders && advancedOrders.length > 0) {
    console.log('\n✅ Advanced mode orders found:');
    advancedOrders.forEach(order => {
      console.log(`   - ${order.file_name} (${order.id.substring(0, 8)}...)`);
    });
  } else {
    console.log('\n⚠️  No orders with advanced_mode = true found!');
    console.log('   This means the advanced_mode flag is not being saved properly.');
  }
}

checkAdvancedSettings()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
