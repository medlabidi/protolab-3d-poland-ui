const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderAndFile() {
  console.log('\n🔍 Checking recent order and file upload...\n');

  // Check orders table
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (orderError) {
    console.error('❌ Error fetching orders:', orderError);
  } else {
    console.log('✅ Most recent order:');
    console.log(JSON.stringify(orders[0], null, 2));
  }

  // Check print-jobs bucket
  const { data: files, error: filesError } = await supabase
    .storage
    .from('print-jobs')
    .list('', {
      limit: 10,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (filesError) {
    console.error('❌ Error fetching files:', filesError);
  } else {
    console.log('\n✅ Files in print-jobs bucket:');
    files.forEach(file => {
      console.log(`  - ${file.name} (${(file.metadata?.size || 0 / 1024).toFixed(2)} KB)`);
    });
  }
}

checkOrderAndFile().catch(console.error);
