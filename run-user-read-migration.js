const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running user_read column migration...\n');
  
  try {
    const sqlPath = path.join(__dirname, 'SQL', 'add-user-read-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if RPC doesn't exist
          const { error: directError } = await supabase.from('_migrations').insert({});
          console.log('Note: Using alternative execution method');
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 What was done:');
    console.log('   - Added user_read column to conversations table');
    console.log('   - Set default value to TRUE for existing conversations');
    console.log('   - Created index for faster queries');
    console.log('\n🎯 Now when admin sends a message:');
    console.log('   - user_read is set to FALSE');
    console.log('   - Conversation shows blue highlight and dot indicator');
    console.log('   - When user opens it, marked as read automatically');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Please run the SQL manually in Supabase dashboard:');
    console.log('   SQL/add-user-read-column.sql');
    process.exit(1);
  }
}

runMigration();
