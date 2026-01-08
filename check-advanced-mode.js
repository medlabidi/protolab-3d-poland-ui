const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdvancedMode() {
  console.log('🔍 Checking advanced_mode column...\n');
  
  try {
    // Try to select advanced_mode column
    const { data, error } = await supabase
      .from('orders')
      .select('id, advanced_mode, layer_height, infill, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('column') && error.message.includes('advanced_mode')) {
        console.log('\n⚠️  advanced_mode column does NOT exist!');
        console.log('   Run migration: SQL/add-advanced-mode-column.sql\n');
      }
      return;
    }
    
    console.log('✅ advanced_mode column EXISTS\n');
    console.log('Recent orders:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAdvancedMode();
