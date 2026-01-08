const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running payment_status constraint migration...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('./SQL/update-payment-status-constraint.sql', 'utf8');
    
    console.log('Executing SQL:\n', sql);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - direct query
      console.log('\nTrying direct query approach...');
      const { error: directError } = await supabase
        .from('_sqlexec')
        .insert({ query: sql });
        
      if (directError) {
        console.error('❌ Direct query also failed:', directError);
        
        // Manual execution needed
        console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.log('='.repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
        process.exit(1);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Payment status constraint now includes: paid, pending, on_hold, refunding, refunded, failed, cancelled');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(fs.readFileSync('./SQL/update-payment-status-constraint.sql', 'utf8'));
    console.log('='.repeat(60));
    process.exit(1);
  }
}

runMigration();
