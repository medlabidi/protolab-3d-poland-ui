const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedPrinter() {
  console.log('🖨️  Seeding default printer...\n');
  
  const printerData = {
    name: 'Primary Printer',
    model: 'Generic FDM Printer',
    power_watts: 270,
    cost_pln: 3483.39,
    lifespan_hours: 5000,
    maintenance_rate: 0.03,
    build_volume_x: 220,
    build_volume_y: 220,
    build_volume_z: 250,
    supported_materials: ['PLA', 'ABS', 'PETG'],
    status: 'operational',
    is_default: true,
    is_active: true
  };

  const { data, error } = await supabase
    .from('printers')
    .upsert(printerData, { onConflict: 'name' })
    .select();

  if (error) {
    console.error('❌ Error seeding printer:', error.message);
    process.exit(1);
  }

  console.log('✅ Printer seeded successfully!');
  console.log(`   Name: ${printerData.name}`);
  console.log(`   Power: ${printerData.power_watts}W`);
  console.log(`   Cost: ${printerData.cost_pln} PLN`);
  console.log(`   Lifespan: ${printerData.lifespan_hours} hours`);
  console.log(`   Default: ${printerData.is_default ? 'Yes' : 'No'}`);
}

seedPrinter();
