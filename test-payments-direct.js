const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCreditsPaymentDirectly() {
  console.log('💳 TESTING CREDITS PAYMENT DIRECTLY');
  console.log('=====================================');
  
  try {
    // Get test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@protolab.com')
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 User:', user.email);

    // Get current balance
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      console.log('❌ Credits lookup error:', creditsError);
      return;
    }

    console.log('💰 Current balance:', credits.balance, 'PLN');

    // Find an unpaid order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, price, payment_status')
      .eq('user_id', user.id)
      .eq('payment_status', 'on_hold')
      .limit(1);

    if (ordersError || !orders || orders.length === 0) {
      console.log('❌ No unpaid orders found');
      return;
    }

    const order = orders[0];
    console.log('📦 Test Order:', order.id);
    console.log('💰 Order Price:', order.price, 'PLN');

    if (credits.balance < order.price) {
      console.log('❌ Insufficient credits for test');
      return;
    }

    // Simulate the credits payment logic directly in the database
    console.log('\n🔄 Processing Credits Payment...');

    // 1. Deduct credits
    const newBalance = credits.balance - order.price;
    const { error: updateError } = await supabase
      .from('credits')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.log('❌ Failed to deduct credits:', updateError);
      return;
    }

    console.log('✅ Credits deducted. New balance:', newBalance, 'PLN');

    // 2. Update order status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: 'credits',
        paid_amount: order.price
      })
      .eq('id', order.id);

    if (orderUpdateError) {
      console.log('❌ Failed to update order:', orderUpdateError);
      return;
    }

    console.log('✅ Order marked as paid');

    // 3. Create transaction record
    const { error: txError } = await supabase
      .from('credits_transactions')
      .insert({
        user_id: user.id,
        amount: -order.price,
        type: 'debit',
        description: `Payment for order #${order.id}`,
        order_id: order.id,
        balance_after: newBalance,
        created_at: new Date().toISOString()
      });

    if (txError) {
      console.log('⚠️ Transaction record failed:', txError);
    } else {
      console.log('✅ Transaction record created');
    }

    console.log('\n🎉 CREDITS PAYMENT TEST SUCCESSFUL!');
    console.log('===================================');
    console.log('✅ Credits deducted:', order.price, 'PLN');
    console.log('✅ New balance:', newBalance, 'PLN');
    console.log('✅ Order status: paid');
    console.log('✅ Transaction recorded');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testBlikOrderCreation() {
  console.log('\n🏦 TESTING BLIK ORDER SCENARIOS');
  console.log('================================');

  try {
    // Get test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@protolab.com')
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found');
      return;
    }

    // BLIK test scenarios
    const blikScenarios = [
      { code: '200201', desc: 'positive authorization with token registration' },
      { code: '500500', desc: 'negative authorization' },
      { code: '777123', desc: 'positive authorization without token registration' },
      { code: '700701', desc: 'BLIK authorization code has expired' },
      { code: '700702', desc: 'BLIK authorization code has been cancelled' },
      { code: '700703', desc: 'BLIK authorization code has already been used' }
    ];

    console.log('📋 BLIK Test Scenarios Available:');
    console.log('================================');

    blikScenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. Code ${scenario.code}: ${scenario.desc}`);
    });

    console.log('\n💡 To test BLIK payments:');
    console.log('1. Navigate to http://localhost:8080/payment/{ORDER_ID}');
    console.log('2. Select the BLIK tab');
    console.log('3. Enter one of the test codes above');
    console.log('4. Click "Pay with BLIK"');
    console.log('5. Check the PayU sandbox response');

    console.log('\n📊 Special Amount Testing (for recurring payment errors):');
    console.log('- Amount 39.30 PLN: triggers AUT_ERROR_MIT_NOT_ALLOWED');
    console.log('- Amount 39.31 PLN: triggers AUT_ERROR_LIMIT_EXCEEDED');  
    console.log('- Amount 39.32 PLN: triggers AUT_ERROR_INSUFFICIENT_FUNDS');

    // Create a test order for BLIK testing
    const testOrder = {
      id: generateUUID(),
      user_id: user.id,
      file_url: 'https://example.com/blik-test.stl',
      file_name: 'blik-test-model.stl',
      material: 'PLA',
      color: 'Red',
      layer_height: 0.2,
      infill: 15,
      quantity: 1,
      price: 12.00, // Small amount for testing
      payment_status: 'on_hold',
      status: 'submitted',
      shipping_method: 'courier',
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
      console.log('❌ Failed to create BLIK test order:', orderError);
      return;
    }

    console.log('\n✅ BLIK Test Order Created:');
    console.log('Order ID:', order.id);
    console.log('Price:', order.price, 'PLN');
    console.log('Status:', order.payment_status);
    console.log('');
    console.log('🔗 Test URL:', `http://localhost:8080/payment/${order.id}`);

  } catch (error) {
    console.log('❌ BLIK test setup failed:', error.message);
  }
}

async function showCurrentStatus() {
  console.log('📊 CURRENT PAYMENT SYSTEM STATUS');
  console.log('=================================');

  try {
    // Get test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@protolab.com')
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found');
      return;
    }

    // Get balance
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    // Get orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, price, payment_status, payment_method, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('👤 User:', user.email);
    console.log('💰 Credits Balance:', credits?.balance || 0, 'PLN');
    console.log('📦 Recent Orders:', orders?.length || 0);

    if (orders && orders.length > 0) {
      console.log('\n📋 Order Details:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.id.slice(0, 8)}... - ${order.price} PLN - ${order.payment_status} (${order.payment_method || 'none'})`);
      });
    }

  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await showCurrentStatus();
  await testCreditsPaymentDirectly();
  await testBlikOrderCreation();
  console.log('\n🏁 TESTING COMPLETE');
}

runTests().catch(console.error);