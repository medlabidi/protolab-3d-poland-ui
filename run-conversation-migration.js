const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('\n🔧 Adding design_request_id column to conversations table...\n');

  try {
    // Step 1: Make order_id nullable
    console.log('Step 1: Making order_id nullable...');
    let { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.conversations ALTER COLUMN order_id DROP NOT NULL;'
    });
    
    if (error1) {
      console.log('⚠️  order_id might already be nullable:', error1.message);
    } else {
      console.log('✅ order_id is now nullable');
    }

    // Step 2: Add design_request_id column
    console.log('\nStep 2: Adding design_request_id column...');
    let { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS design_request_id UUID REFERENCES public.design_requests(id) ON DELETE CASCADE;'
    });
    
    if (error2) {
      console.log('⚠️  design_request_id might already exist:', error2.message);
    } else {
      console.log('✅ design_request_id column added');
    }

    // Step 3: Create index
    console.log('\nStep 3: Creating index on design_request_id...');
    let { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_conversations_design_request_id ON public.conversations(design_request_id);'
    });
    
    if (error3) {
      console.log('⚠️  Index might already exist:', error3.message);
    } else {
      console.log('✅ Index created');
    }

    // Step 4: Verify the changes
    console.log('\n📋 Verifying changes...');
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Error verifying changes:', error.message);
    } else {
      console.log('✅ Table structure verified');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Note: You may need to manually add the check constraint in Supabase SQL Editor:');
    console.log(`
ALTER TABLE public.conversations 
  ADD CONSTRAINT chk_conversation_reference 
  CHECK (
    (order_id IS NOT NULL AND design_request_id IS NULL) OR 
    (order_id IS NULL AND design_request_id IS NOT NULL)
  );
    `);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
