const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function initCredits() {
  console.log('Initializing credits tables...\n');

  try {
    // Create credits table
    const { error: creditsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.credits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (creditsTableError) {
      console.error('Error creating credits table:', creditsTableError);
    } else {
      console.log('✅ Credits table ready');
    }

    // Create credits_transactions table
    const { error: transactionsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.credits_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          balance_after DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (transactionsTableError) {
      console.error('Error creating transactions table:', transactionsTableError);
    } else {
      console.log('✅ Credits transactions table ready');
    }

    console.log('\n✨ Credits system initialized successfully!');
    console.log('\nNote: You may need to manually run the SQL from SQL/add-credits-table.sql');
    console.log('in your Supabase SQL Editor to set up RLS policies and indexes.');
    
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

initCredits();
