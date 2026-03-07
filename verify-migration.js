// Verification script to check migration status
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.log('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('\n🔍 Verifying Migration Status...\n');
  console.log('='.repeat(60));

  try {
    // Check print_jobs table
    console.log('\n1. Checking print_jobs table...');
    const { data: printJobs, error: printError } = await supabase
      .from('print_jobs')
      .select('id')
      .limit(1);
    
    if (printError) {
      console.log('   ❌ print_jobs table not found');
      console.log('   Error:', printError.message);
    } else {
      console.log('   ✅ print_jobs table exists');
      
      // Count records
      const { count: printCount } = await supabase
        .from('print_jobs')
        .select('*', { count: 'exact', head: true });
      console.log(`   📊 Records: ${printCount}`);
    }

    // Check design_requests table
    console.log('\n2. Checking design_requests table...');
    const { data: designReqs, error: designError } = await supabase
      .from('design_requests')
      .select('id')
      .limit(1);
    
    if (designError) {
      console.log('   ❌ design_requests table not found');
      console.log('   Error:', designError.message);
    } else {
      console.log('   ✅ design_requests table exists');
      
      // Count records
      const { count: designCount } = await supabase
        .from('design_requests')
        .select('*', { count: 'exact', head: true });
      console.log(`   📊 Records: ${designCount}`);
    }

    // Check all_orders view
    console.log('\n3. Checking all_orders view...');
    const { data: viewData, error: viewError } = await supabase
      .from('all_orders')
      .select('order_type')
      .limit(1);
    
    if (viewError) {
      console.log('   ❌ all_orders view not found');
      console.log('   Error:', viewError.message);
    } else {
      console.log('   ✅ all_orders view exists');
      
      // Count by type
      const { data: typeCounts } = await supabase
        .from('all_orders')
        .select('order_type');
      
      if (typeCounts) {
        const printCount = typeCounts.filter(o => o.order_type === 'print').length;
        const designCount = typeCounts.filter(o => o.order_type === 'design').length;
        console.log(`   📊 Print orders: ${printCount}`);
        console.log(`   📊 Design requests: ${designCount}`);
      }
    }

    // Check old orders table
    console.log('\n4. Checking old orders table (backup)...');
    const { data: oldOrders, error: oldError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (oldError) {
      console.log('   ⚠️  orders table not found (may have been renamed)');
    } else {
      const { count: oldCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      console.log(`   ✅ orders table exists (backup)`);
      console.log(`   📊 Records: ${oldCount}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Migration Verification Complete!\n');
    
    if (!printError && !designError && !viewError) {
      console.log('🎉 All checks passed! Migration successful!\n');
      console.log('Next steps:');
      console.log('1. Restart your server: cd server && npm run dev');
      console.log('2. Test creating orders through your application');
      console.log('3. Verify admin dashboard displays correctly');
      console.log('4. Check user dashboard shows their orders\n');
    } else {
      console.log('⚠️  Migration incomplete. Please run the migration script in Supabase SQL Editor.');
      console.log('   File: SQL/separate-print-design-tables.sql\n');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.log('\nPlease check:');
    console.log('1. Supabase connection is working');
    console.log('2. Environment variables are set correctly');
    console.log('3. You have the correct permissions\n');
  }
}

// Run verification
verifyMigration().catch(console.error);
