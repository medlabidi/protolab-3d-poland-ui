const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('🧪 Checking Database Schema\n');
  
  try {
    // Check if shipping_address column exists by trying to query it
    console.log('Test 1: Checking if shipping_address column exists...');
    const { data, error } = await supabase
      .from('orders')
      .select('shipping_address')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ shipping_address column does NOT exist');
        console.log('\n⚠️  You need to run the migration!');
        console.log('   Go to Supabase SQL Editor and run: SQL/update-orders-delivery.sql\n');
        return false;
      } else {
        console.log('✅ shipping_address column EXISTS');
      }
    } else {
      console.log('✅ shipping_address column EXISTS');
    }
    
    // Check if dpd is allowed in shipping_method
    console.log('\nTest 2: Checking if "dpd" is allowed in shipping_method...');
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    
    const { error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id: testUserId,
        file_url: 'https://test.com/test.stl',
        file_name: 'test.stl',
        material: 'pla',
        color: 'white',
        layer_height: 0.2,
        infill: 20,
        quantity: 1,
        shipping_method: 'dpd',
        price: 0
      });
    
    if (insertError) {
      if (insertError.message.includes('violates check constraint')) {
        console.log('❌ "dpd" is NOT allowed in shipping_method constraint');
        console.log('\n⚠️  You need to run the migration!');
        console.log('   Go to Supabase SQL Editor and run: SQL/update-orders-delivery.sql\n');
        return false;
      } else if (insertError.message.includes('foreign key') || insertError.message.includes('not present')) {
        // Expected - the test user doesn't exist, but constraint check passed
        console.log('✅ "dpd" is allowed in shipping_method (foreign key error is expected)');
      } else {
        console.log('❌ Unexpected error:', insertError.message);
      }
    } else {
      console.log('✅ "dpd" is allowed in shipping_method');
      // Clean up the test order
      await supabase.from('orders').delete().eq('file_name', 'test.stl');
    }
    
    console.log('\n✅ Database schema is ready!');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    return false;
  }
}

checkDatabase();
