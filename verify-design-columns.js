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

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDesignColumns() {
  console.log('🔍 Checking if design columns exist in orders table...\n');

  // Test query to check for design columns
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_type, design_description, design_requirements, reference_images, design_usage, design_usage_details, design_dimensions')
    .limit(1);

  if (error) {
    console.error('❌ Error querying design columns:');
    console.error(error.message);
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      const missingColumn = error.message.match(/column "([^"]+)"/)?.[1];
      console.error(`\n⚠️  Missing column: ${missingColumn}`);
      console.error('\n📋 You need to run one or both of these migrations:');
      console.error('   - SQL/add_order_type.sql');
      console.error('   - SQL/add_design_fields.sql');
    }
    return;
  }

  console.log('✅ All design columns exist in orders table!');
  console.log('\n📊 Available columns verified:');
  console.log('   - order_type');
  console.log('   - design_description');
  console.log('   - design_requirements');
  console.log('   - reference_images');
  console.log('   - design_usage');
  console.log('   - design_usage_details');
  console.log('   - design_dimensions');

  // Check if there are any design orders
  const { data: designOrders, error: countError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('order_type', 'design');

  if (!countError) {
    console.log(`\n📈 Found ${designOrders || 0} design orders in database`);
  }
}

verifyDesignColumns();
