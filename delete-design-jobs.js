const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function deleteDesignJobs() {
  console.log('WARNING: This will delete ALL design jobs (order_type = "design") from the database!');
  console.log('Starting deletion in 3 seconds...');

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Count first
    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_type', 'design');

    if (countError) {
      console.error('Error counting design jobs:', countError);
      process.exit(1);
    }

    console.log(`Found ${count} design job(s) to delete...`);

    if (count === 0) {
      console.log('No design jobs found. Nothing to delete.');
      process.exit(0);
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_type', 'design');

    if (error) {
      console.error('Error deleting design jobs:', error);
      process.exit(1);
    }

    console.log(`Successfully deleted ${count} design job(s).`);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

deleteDesignJobs();
