const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getOrCreateTestUser() {
  console.log('=== GETTING/CREATING TEST USER ===');
  
  try {
    // First try to find existing test user
    const { data: existingUsers, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@protolab.com')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.log('❌ Error finding user:', findError);
      return null;
    }

    if (existingUsers) {
      console.log('✅ Using existing test user:', existingUsers.email);
      return existingUsers;
    }

    // Create new user if not found
    const testUser = {
      id: generateUUID(),
      email: 'test@protolab.com',
      name: 'Test User',
      password_hash: '$2b$10$dummyhashfortesting',
      email_verified: true,
      role: 'user',
      status: 'approved',
      created_at: new Date().toISOString()
    };

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (userError) {
      console.log('❌ Failed to create user:', userError);
      return null;
    }

    console.log('✅ Test user created:', user.email);
    return user;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function addCreditsToUser(userId) {
  console.log('\n=== CHECKING/ADDING CREDITS TO USER ===');
  
  try {
    // Check current balance first
    const { data: existingCredits, error: checkError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (existingCredits) {
      console.log('✅ User already has credits:', existingCredits.balance, 'PLN');
      
      if (existingCredits.balance >= 25) {
        console.log('💰 Sufficient balance for testing!');
        return;
      }
      
      // Update to ensure sufficient balance
      const newBalance = Math.max(100, existingCredits.balance);
      const { error: updateError } = await supabase
        .from('credits')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.log('❌ Failed to update credits:', updateError);
      } else {
        console.log('✅ Updated balance to:', newBalance, 'PLN');
      }
      return;
    }

    // Add new credits record
    const { error: creditsError } = await supabase
      .from('credits')
      .insert({
        user_id: userId,
        balance: 100.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (creditsError) {
      console.log('❌ Failed to add credits:', creditsError);
      return;
    }

    console.log('✅ Added 100 PLN test credits');

  } catch (error) {
    console.log('❌ Error with credits:', error.message);
  }
}

async function createTestOrder(userId) {
  console.log('\n=== CREATING TEST ORDER ===');
  
  try {
    // Create order with all required fields based on the schema
    const testOrder = {
      id: generateUUID(),
      user_id: userId,
      file_url: 'https://example.com/test-model.stl', // Required field
      file_name: 'test-model.stl',
      material: 'PLA',
      color: 'Black',
      layer_height: 0.2,
      infill: 20,
      quantity: 1,
      price: 25.00,
      payment_status: 'on_hold',
      status: 'submitted',
      shipping_method: 'courier', // Required field
      created_at: new Date().toISOString(),
      is_archived: false,
      advanced_mode: false
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (orderError) {
      console.log('❌ Failed to create test order:', orderError);
      return null;
    }

    console.log('✅ Test order created:', order.id);
    console.log('💰 Order price:', order.price, 'PLN');
    return order;

  } catch (error) {
    console.log('❌ Error creating order:', error.message);
    return null;
  }
}

async function checkUserSchema() {
  console.log('\n=== CHECKING USER TABLE SCHEMA ===');
  
  try {
    // Try to get any existing user to see the structure
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.log('❌ Error fetching users:', userError);
      return null;
    }

    if (users && users.length > 0) {
      console.log('User table columns:', Object.keys(users[0]));
      console.log('Sample user:', users[0]);
      return Object.keys(users[0]);
    } else {
      console.log('No users found, trying to insert minimal user to see required fields...');
      
      // Try minimal insert to see what's required
      const testUser = {
        id: 'schema-test-' + Date.now(),
        email: 'schema-test@test.com'
      };

      const { data: user, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Insert error (shows required fields):', insertError);
        return null;
      }
      
      console.log('✅ Minimal user created:', user);
      console.log('User table columns:', Object.keys(user));
      return Object.keys(user);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🧪 PAYMENT TEST SETUP');
  console.log('======================');
  
  const user = await getOrCreateTestUser();
  if (!user) return;
  
  await addCreditsToUser(user.id);
  const order = await createTestOrder(user.id);
  
  if (order) {
    console.log('\n🎉 TEST SETUP COMPLETE');
    console.log('======================');
    console.log('Test Credentials:');
    console.log('Email:', user.email);
    console.log('User ID:', user.id);
    console.log('Credits: 100.00 PLN (if successfully added)');
    console.log('Test Order ID:', order.id);
    console.log('Test Order Price:', order.price, 'PLN');
    console.log('');
    console.log('💡 To test payments:');
    console.log(`1. Navigate to: http://localhost:8080/payment/${order.id}`);
    console.log('2. Test Credits payment (should succeed with 100 PLN balance)');
    console.log('3. Create another order and test BLIK payment');
  }
}

main().catch(console.error);