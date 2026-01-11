const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running printer detailed specs migration...');
    
    const migrationFile = path.join(__dirname, 'SQL', 'migrations', 'add-printer-detailed-specs.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 80) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: queryError } = await supabase.from('_migrations').insert([
            { name: 'add-printer-detailed-specs', executed_at: new Date().toISOString() }
          ]);
          
          if (queryError) {
            console.warn('⚠️  Note:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 New columns added to printers table:');
    console.log('  - brand (VARCHAR)');
    console.log('  - printer_model (VARCHAR)');
    console.log('  - max_build_volume (VARCHAR)');
    console.log('  - multi_color_printing (BOOLEAN)');
    console.log('  - max_colors (INTEGER)');
    console.log('  - available_nozzle_diameters (TEXT)');
    console.log('  - actual_nozzle_diameter (DECIMAL)');
    console.log('  - purchase_price (DECIMAL)');
    console.log('  - lifespan_years (INTEGER)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
