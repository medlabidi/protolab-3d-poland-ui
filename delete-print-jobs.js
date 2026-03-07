const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function deletePrintJobs() {
  console.log('WARNING: This will delete ALL print jobs (order_type = "print") from the database!');
  console.log('Starting deletion in 3 seconds...');

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Count first
    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_type', 'print');

    if (countError) {
      console.error('Error counting print jobs:', countError);
      process.exit(1);
    }

    console.log(`Found ${count} print job(s) to delete...`);

    if (count === 0) {
      console.log('No print jobs found. Nothing to delete.');
      process.exit(0);
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_type', 'print');

    if (error) {
      console.error('Error deleting print jobs:', error);
      process.exit(1);
    }

    console.log(`Successfully deleted ${count} print job(s).`);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

deletePrintJobs();
