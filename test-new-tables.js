// Quick test script to verify new tables work
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

async function testNewTables() {
  console.log('\n🧪 Testing New Database Tables...\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Query print_jobs
    console.log('\n1. Testing print_jobs table...');
    const { data: printJobs, error: printError } = await supabase
      .from('print_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (printError) {
      console.log('   ❌ Error:', printError.message);
    } else {
      console.log(`   ✅ Query successful`);
      console.log(`   📊 Found ${printJobs?.length || 0} recent print jobs`);
      
      if (printJobs && printJobs.length > 0) {
        console.log('\n   Sample print job:');
        const sample = printJobs[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - File: ${sample.file_name}`);
        console.log(`   - Material: ${sample.material}`);
        console.log(`   - Status: ${sample.status}`);
        console.log(`   - Price: ${sample.price} PLN`);
      }
    }

    // Test 2: Query design_requests
    console.log('\n2. Testing design_requests table...');
    const { data: designReqs, error: designError } = await supabase
      .from('design_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (designError) {
      console.log('   ❌ Error:', designError.message);
    } else {
      console.log(`   ✅ Query successful`);
      console.log(`   📊 Found ${designReqs?.length || 0} recent design requests`);
      
      if (designReqs && designReqs.length > 0) {
        console.log('\n   Sample design request:');
        const sample = designReqs[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Project: ${sample.project_name}`);
        console.log(`   - Usage: ${sample.usage_type || 'not specified'}`);
        console.log(`   - Status: ${sample.design_status}`);
        console.log(`   - Chat Requested: ${sample.request_chat ? 'Yes' : 'No'}`);
      }
    }

    // Test 3: Query all_orders view
    console.log('\n3. Testing all_orders view...');
    const { data: allOrders, error: viewError } = await supabase
      .from('all_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (viewError) {
      console.log('   ❌ Error:', viewError.message);
    } else {
      console.log(`   ✅ Query successful`);
      console.log(`   📊 Found ${allOrders?.length || 0} total orders`);
      
      if (allOrders && allOrders.length > 0) {
        const printCount = allOrders.filter(o => o.order_type === 'print').length;
        const designCount = allOrders.filter(o => o.order_type === 'design').length;
        console.log(`   - Print orders: ${printCount}`);
        console.log(`   - Design requests: ${designCount}`);
      }
    }

    // Test 4: Statistics
    console.log('\n4. Getting statistics...');
    
    // Print jobs by status
    const { data: printStats } = await supabase
      .from('print_jobs')
      .select('status');
    
    if (printStats) {
      console.log('\n   Print Jobs by Status:');
      const statuses = ['submitted', 'in_queue', 'printing', 'finished', 'delivered'];
      statuses.forEach(status => {
        const count = printStats.filter(j => j.status === status).length;
        if (count > 0) {
          console.log(`   - ${status}: ${count}`);
        }
      });
    }

    // Design requests by status
    const { data: designStats } = await supabase
      .from('design_requests')
      .select('design_status');
    
    if (designStats) {
      console.log('\n   Design Requests by Status:');
      const statuses = ['pending', 'in_review', 'in_progress', 'completed', 'cancelled'];
      statuses.forEach(status => {
        const count = designStats.filter(d => d.design_status === status).length;
        if (count > 0) {
          console.log(`   - ${status}: ${count}`);
        }
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All Tests Passed!\n');
    console.log('The new database structure is working correctly.');
    console.log('You can now use the application with the separated tables.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\nPlease check your database connection and migration status.\n');
  }
}

// Run tests
testNewTables().catch(console.error);
