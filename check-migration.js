const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkMigration() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Checking if model_volume_cm3 column exists...\n');
  
  try {
    // Try to query the column
    const { data, error } = await supabase
      .from('orders')
      .select('id, model_volume_cm3')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Column model_volume_cm3 does NOT exist yet');
        console.log('\n📋 Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('\nALTER TABLE orders ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);\n');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Column model_volume_cm3 exists!');
    
    // Check if any orders have the volume populated
    const { data: ordersWithVolume } = await supabase
      .from('orders')
      .select('id, order_number, model_volume_cm3, material_weight, print_time')
      .not('model_volume_cm3', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`\n📊 Orders with model_volume_cm3 populated: ${ordersWithVolume?.length || 0}`);
    
    if (ordersWithVolume && ordersWithVolume.length > 0) {
      console.log('\nSample orders:');
      ordersWithVolume.forEach(order => {
        console.log(`  - ${order.order_number}: volume=${order.model_volume_cm3} cm³, weight=${order.material_weight}g, time=${order.print_time}min`);
      });
    } else {
      console.log('\n⚠️  No orders with model_volume_cm3 yet (expected for old orders)');
      console.log('   New orders created from now on will have this field populated');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

checkMigration();
