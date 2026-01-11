const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Check for env vars
console.log('Checking environment variables...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'MISSING');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPrinterDB() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Count total printers
    const { count, error: countError } = await supabase
      .from('printers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting printers:', countError);
      return;
    }
    
    console.log('✅ Total printers:', count);
    
    // Get all printers with default status
    const { data: printers, error: fetchError } = await supabase
      .from('printers')
      .select('id, name, is_default, is_active')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching printers:', fetchError);
      return;
    }
    
    console.log('\n📋 Current printers:');
    printers.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id})`);
      console.log(`    Default: ${p.is_default}, Active: ${p.is_active}`);
    });
    
    // Count how many are default
    const defaultCount = printers.filter(p => p.is_default).length;
    console.log(`\n⚠️ Printers marked as default: ${defaultCount}`);
    
    if (defaultCount > 1) {
      console.log('❌ ISSUE: Multiple printers are default! Fixing...');
      
      // Get the first printer
      const firstPrinter = printers[0];
      
      // Set all to false
      await supabase
        .from('printers')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Set first one to true
      await supabase
        .from('printers')
        .update({ is_default: true })
        .eq('id', firstPrinter.id);
      
      console.log(`✅ Set ${firstPrinter.name} as the only default printer`);
    } else if (defaultCount === 0 && count > 0) {
      console.log('❌ ISSUE: No printer is default! Fixing...');
      
      const firstPrinter = printers[0];
      await supabase
        .from('printers')
        .update({ is_default: true })
        .eq('id', firstPrinter.id);
      
      console.log(`✅ Set ${firstPrinter.name} as default printer`);
    } else {
      console.log('✅ Default printer configuration is correct');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPrinterDB();
