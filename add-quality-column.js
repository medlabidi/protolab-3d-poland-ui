const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addQualityColumn() {
  console.log('Adding quality column to orders table...');
  
  const sql = `
    ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS quality TEXT
    CHECK (quality IS NULL OR quality IN ('draft', 'standard', 'high', 'ultra'));
  `;
  
  try {
    // Try using the SQL editor endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      throw new Error('RPC call failed');
    }
    
    console.log('✅ Quality column added successfully!');
  } catch (error) {
    console.error('❌ Could not add column via API. Please run this SQL manually in Supabase SQL Editor:');
    console.log('\n--- Copy and paste this SQL ---\n');
    console.log(sql);
    console.log('\n--- End of SQL ---\n');
    console.log('\nGo to: https://supabase.com/dashboard/project/_/sql/new');
  }
}

addQualityColumn();
