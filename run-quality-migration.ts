import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running quality column migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'SQL', 'add-quality-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration error:', error);
      
      // Try direct execution if rpc fails
      console.log('Trying direct execution...');
      const { error: directError } = await supabase.from('orders').select('quality').limit(0);
      
      if (directError) {
        console.error('Direct execution also failed:', directError);
        console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log(sql);
        process.exit(1);
      } else {
        console.log('Column might already exist. Checking...');
      }
    }
    
    console.log('✅ Quality column migration completed!');
    console.log('Note: This column stores the quality preset (draft/standard/high/ultra) for normal mode orders.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

runMigration();
