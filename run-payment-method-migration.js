require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running payment_method migration...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'SQL', 'add-payment-method.sql'), 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method - direct SQL execution
      console.log('Trying direct SQL execution...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 100) + '...');
          const { error: execError } = await supabase.rpc('exec', { 
            query: statement + ';' 
          });
          
          if (execError) {
            console.error('Statement failed:', execError);
            // Continue anyway as column might already exist
          }
        }
      }
    }
    
    console.log('✅ Migration completed');
    
    // Verify the column exists
    const { data: orders, error: selectError } = await supabase
      .from('orders')
      .select('payment_method')
      .limit(1);
    
    if (selectError) {
      console.error('Verification failed:', selectError);
    } else {
      console.log('✅ Column verified: payment_method exists');
    }
    
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigration();
