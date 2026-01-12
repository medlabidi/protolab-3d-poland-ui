import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename: string) {
  console.log(`\n🔄 Running migration: ${filename}`);
  
  try {
    const sqlPath = join(__dirname, 'SQL', filename);
    const sql = readFileSync(sqlPath, 'utf-8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error running ${filename}:`, error.message);
      return false;
    }
    
    console.log(`✅ Successfully ran ${filename}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to run ${filename}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running database migrations for refund and notification features...\n');
  
  const migrations = [
    'add-refund-fields.sql',
    'create-notifications-table.sql',
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Migration Results: ${successCount}/${migrations.length} successful`);
  
  if (successCount === migrations.length) {
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } else {
    console.log('⚠️ Some migrations failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
