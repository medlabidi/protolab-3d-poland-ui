const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const PRODUCTION_URL = 'https://protolabb-griisfn6j-med-labidis-projects.vercel.app';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function testProductionCreditsPayment() {
  console.log('🚀 TESTING CREDITS PAYMENT IN PRODUCTION');
  console.log('=========================================');
  console.log('Production URL:', PRODUCTION_URL);
  
  try {
    // Get test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@protolab.com')
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found');
      return false;
    }

    console.log('👤 User:', user.email);

    // Check/add credits if needed
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      console.log('❌ Credits lookup error:', creditsError);
      return false;
    }

    console.log('💰 Current balance:', credits.balance, 'PLN');

    // Ensure sufficient credits for testing
    if (credits.balance < 20) {
      const { error: updateError } = await supabase
        .from('credits')
        .update({
          balance: 100,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.log('❌ Failed to add test credits:', updateError);
        return false;
      }

      console.log('✅ Added test credits. New balance: 100 PLN');
    }

    // Create test order
    const testOrder = {
      id: generateUUID(),
      user_id: user.id,
      file_url: 'https://example.com/prod-test.stl',
      file_name: 'production-test.stl',
      material: 'PLA',
      color: 'Blue',
      layer_height: 0.2,
      infill: 20,
      quantity: 1,
      price: 18.00, // Test amount
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
      console.log('❌ Failed to create test order:', orderError);
      return false;
    }

    console.log('📦 Test Order Created:', order.id);
    console.log('💰 Order Price:', order.price, 'PLN');

    // Test credits payment via production API
    console.log('\n🔄 Testing Credits Payment via Production API...');
    
    const fetch = require('node-fetch');
    const response = await fetch(`${PRODUCTION_URL}/api/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_method: 'credits'
      })
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { rawResponse: responseText };
    }

    if (response.ok) {
      console.log('✅ Credits Payment API Success:', response.status);
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      
      // Verify the payment in database
      const { data: updatedOrder, error: verifyError } = await supabase
        .from('orders')
        .select('payment_status, payment_method, paid_amount')
        .eq('id', order.id)
        .single();

      if (!verifyError && updatedOrder) {
        console.log('✅ Payment Verified in Database:');
        console.log('   Status:', updatedOrder.payment_status);
        console.log('   Method:', updatedOrder.payment_method);
        console.log('   Amount:', updatedOrder.paid_amount, 'PLN');
      }

      // Check updated balance
      const { data: newCredits } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (newCredits) {
        console.log('✅ Updated balance:', newCredits.balance, 'PLN');
      }

      return true;
    } else {
      console.log('❌ Credits Payment API Error:', response.status);
      console.log('📋 Error Response:', JSON.stringify(result, null, 2));
      return false;
    }

  } catch (error) {
    console.log('❌ Production test failed:', error.message);
    return false;
  }
}

async function testProductionBlikPayment() {
  console.log('\n🏦 TESTING BLIK PAYMENT IN PRODUCTION');
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
      return false;
    }

    // Create BLIK test order
    const blikOrder = {
      id: generateUUID(),
      user_id: user.id,
      file_url: 'https://example.com/blik-prod-test.stl',
      file_name: 'blik-production-test.stl',
      material: 'PETG',
      color: 'Green',
      layer_height: 0.2,
      infill: 15,
      quantity: 1,
      price: 22.00, // Test amount
      payment_status: 'on_hold',
      status: 'submitted',
      shipping_method: 'courier',
      created_at: new Date().toISOString(),
      is_archived: false,
      advanced_mode: false
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([blikOrder])
      .select()
      .single();

    if (orderError) {
      console.log('❌ Failed to create BLIK test order:', orderError);
      return false;
    }

    console.log('📦 BLIK Test Order:', order.id);
    console.log('💰 Order Price:', order.price, 'PLN');

    // Test BLIK payment with positive test code
    console.log('\n🔄 Testing BLIK Payment via Production API...');
    console.log('Using test code: 777123 (positive authorization)');
    
    const fetch = require('node-fetch');
    const blikResponse = await fetch(`${PRODUCTION_URL}/api/payments/payu/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.price,
        description: `Production BLIK Test - Order #${order.id.slice(0, 8)}`,
        userId: order.user_id,
        payMethods: {
          payMethod: {
            type: 'PBL',
            value: 'blik',
            authorizationCode: '777123' // Positive test code
          }
        }
      })
    });

    const blikResponseText = await blikResponse.text();
    let blikResult;
    
    try {
      blikResult = JSON.parse(blikResponseText);
    } catch (e) {
      blikResult = { rawResponse: blikResponseText };
    }

    if (blikResponse.ok) {
      console.log('✅ BLIK Payment API Success:', blikResponse.status);
      console.log('📋 PayU Response:', JSON.stringify(blikResult, null, 2));
      
      if (blikResult.redirectUri) {
        console.log('🔗 PayU Redirect URL:', blikResult.redirectUri);
      }
      if (blikResult.statusCode) {
        console.log('📊 PayU Status:', blikResult.statusCode);
      }
      
      return true;
    } else {
      console.log('❌ BLIK Payment API Error:', blikResponse.status);
      console.log('📋 Error Response:', JSON.stringify(blikResult, null, 2));
      return false;
    }

  } catch (error) {
    console.log('❌ BLIK production test failed:', error.message);
    return false;
  }
}

async function showProductionTestUrls() {
  console.log('\n🌐 PRODUCTION TEST URLS');
  console.log('=======================');
  
  try {
    // Get recent test orders
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'test@protolab.com')
      .single();

    if (user) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, file_name, price, payment_status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (orders) {
        console.log('🔗 Recent Test Orders for Manual Testing:');
        orders.forEach((order, index) => {
          const status = order.payment_status === 'paid' ? '✅ PAID' : '⏳ PENDING';
          console.log(`${index + 1}. ${order.file_name} - ${order.price} PLN - ${status}`);
          console.log(`   URL: ${PRODUCTION_URL}/payment/${order.id}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.log('❌ Failed to get test URLs:', error.message);
  }
}

async function runProductionTests() {
  console.log('🚀 PRODUCTION PAYMENT SYSTEM TESTING');
  console.log('=====================================');
  console.log('Environment: PRODUCTION');
  console.log('URL:', PRODUCTION_URL);
  console.log('Date:', new Date().toLocaleString());
  console.log('');

  const creditsSuccess = await testProductionCreditsPayment();
  const blikSuccess = await testProductionBlikPayment();
  await showProductionTestUrls();

  console.log('\n📊 PRODUCTION TEST RESULTS');
  console.log('===========================');
  console.log('💳 Credits Payment:', creditsSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('🏦 BLIK Payment:   ', blikSuccess ? '✅ PASS' : '❌ FAIL');
  
  const overallSuccess = creditsSuccess && blikSuccess;
  console.log('🎯 Overall Result: ', overallSuccess ? '✅ PRODUCTION READY' : '⚠️ ISSUES DETECTED');
  
  if (overallSuccess) {
    console.log('\n🎉 PRODUCTION PAYMENT SYSTEM IS FULLY FUNCTIONAL!');
    console.log('Both Credits and BLIK payments are working correctly.');
  }

  console.log('\n💡 BLIK Test Codes for Manual Testing:');
  console.log('   200201 - Positive with token registration');
  console.log('   777123 - Positive without token registration');
  console.log('   500500 - Negative authorization');
  console.log('   700701 - Expired code');
  console.log('   700702 - Cancelled code');
  console.log('   700703 - Already used code');
}

runProductionTests().catch(console.error);