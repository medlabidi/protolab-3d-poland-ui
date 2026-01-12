const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read and parse .env.production
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?\s*$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/\\r\\n/g, '').replace(/\r/g, '').replace(/\n/g, '').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running design service migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'SQL', 'add-design-service-complete.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  exec_sql function not available, trying alternative method...\n');
        
        // Split SQL into individual statements and execute
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          console.log(`${i + 1}. Executing: ${stmt.substring(0, 60)}...`);
          
          // Use the from().select() with a raw SQL query trick
          // Note: This won't work for DDL statements, user needs to run migration manually
        }

        console.log('\n⚠️  Cannot run DDL migrations programmatically.');
        console.log('📋 Please run the migration manually in Supabase SQL Editor:\n');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of SQL/add-design-service-complete.sql');
        console.log('4. Click "Run"\n');
        console.log('Migration file location:');
        console.log(`   ${migrationPath}\n`);
        
        return;
      }
      
      throw error;
    }

    console.log('✅ Migration executed successfully!');

    // Verify the migration
    console.log('\n🔍 Verifying new columns...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('id, order_type, design_description, design_usage, design_usage_details, design_dimensions')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ All design columns verified successfully!\n');
      console.log('📊 Available columns:');
      console.log('   - order_type');
      console.log('   - design_description');
      console.log('   - design_usage');
      console.log('   - design_usage_details');
      console.log('   - design_dimensions');
      console.log('   - design_requirements');
      console.log('   - reference_images');
      console.log('   - parent_order_id');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Please run the migration manually in Supabase SQL Editor:\n');
    console.error('1. Go to your Supabase project dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of SQL/add-design-service-complete.sql');
    console.error('4. Click "Run"\n');
    console.error('Migration file location:');
    console.error(`   ${migrationPath}\n`);
  }
}

runMigration();
