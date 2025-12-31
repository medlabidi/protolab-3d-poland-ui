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

// BLIK test codes from PayU documentation
const BLIK_TEST_CODES = {
  '200201': 'positive authorization with token registration',
  '500500': 'negative authorization',
  '777123': 'positive authorization without token registration',  
  '777456': 'positive authorization without token registration (variant)',
  '700701': 'BLIK authorization code has expired',
  '700702': 'BLIK authorization code has been cancelled', 
  '700703': 'BLIK authorization code has already been used'
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getTestUser() {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'test@protolab.com')
    .single();

  if (error || !user) {
    console.log('❌ Test user not found');
    return null;
  }
  
  return user;
}

async function createTestOrderForBlik(userId, testName) {
  const testOrder = {
    id: generateUUID(),
    user_id: userId,
    file_url: 'https://example.com/test-model.stl',
    file_name: `blik-test-${testName}.stl`,
    material: 'PLA',
    color: 'Black', 
    layer_height: 0.2,
    infill: 20,
    quantity: 1,
    price: 15.00, // Small amount for testing
    payment_status: 'on_hold',
    status: 'submitted',
    shipping_method: 'courier',
    created_at: new Date().toISOString(),
    is_archived: false,
    advanced_mode: false
  };

  const { data: order, error } = await supabase
    .from('orders')
    .insert([testOrder])
    .select()
    .single();

  if (error) {
    console.log('❌ Failed to create test order:', error);
    return null;
  }

  return order;
}

async function testBlikPayment(order, blikCode, testDescription) {
  console.log(`\n🧪 Testing BLIK: ${blikCode} - ${testDescription}`);
  console.log(`📦 Order: ${order.id} (${order.price} PLN)`);
  
  try {
    // Simulate API call to PayU create endpoint
    const paymentData = {
      orderId: order.id,
      amount: order.price,
      description: `BLIK Test ${blikCode} - Order #${order.id.slice(0, 8)}`,
      userId: order.user_id,
      payMethods: {
        payMethod: {
          type: 'PBL',
          value: 'blik',
          authorizationCode: blikCode
        }
      }
    };

    console.log('📤 Sending PayU request...');
    console.log('   BLIK Code:', blikCode);
    console.log('   Amount:', order.price, 'PLN');

    // Make actual API call to test the endpoint
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:8080/api/payments/payu/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { rawResponse: responseText };
    }

    if (response.ok) {
      console.log('✅ PayU API Response:', response.status);
      console.log('📋 Result:', JSON.stringify(result, null, 2));
      
      if (result.redirectUri) {
        console.log('🔗 Redirect URL:', result.redirectUri);
      }
      if (result.statusCode) {
        console.log('📊 Status Code:', result.statusCode);
      }
    } else {
      console.log('❌ PayU API Error:', response.status);
      console.log('📋 Error:', JSON.stringify(result, null, 2));
    }

    return { success: response.ok, response: result, status: response.status };

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCreditsPayment(order) {
  console.log(`\n💳 Testing Credits Payment`);
  console.log(`📦 Order: ${order.id} (${order.price} PLN)`);
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`http://localhost:8080/api/orders/${order.id}`, {
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
      console.log('✅ Credits Payment Success:', response.status);
      console.log('📋 Updated Order:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Credits Payment Error:', response.status);
      console.log('📋 Error:', JSON.stringify(result, null, 2));
    }

    return { success: response.ok, response: result, status: response.status };

  } catch (error) {
    console.log('❌ Credits test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllPaymentTests() {
  console.log('🚀 COMPREHENSIVE PAYMENT METHOD TESTING');
  console.log('==========================================');

  const user = await getTestUser();
  if (!user) return;

  console.log('👤 Test User:', user.email);
  console.log('🆔 User ID:', user.id);

  const results = {
    blik: {},
    credits: null
  };

  // Test Credits Payment first
  console.log('\n═══ CREDITS PAYMENT TEST ═══');
  const creditsOrder = await createTestOrderForBlik(user.id, 'credits');
  if (creditsOrder) {
    results.credits = await testCreditsPayment(creditsOrder);
  }

  // Test BLIK Payment scenarios
  console.log('\n═══ BLIK PAYMENT TESTS ═══');
  
  for (const [blikCode, description] of Object.entries(BLIK_TEST_CODES)) {
    const order = await createTestOrderForBlik(user.id, blikCode);
    if (order) {
      results.blik[blikCode] = await testBlikPayment(order, blikCode, description);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Test special amount scenarios (for recurring payments errors)
  console.log('\n═══ SPECIAL BLIK SCENARIOS ═══');
  
  const specialScenarios = {
    '3930': 'AUT_ERROR_MIT_NOT_ALLOWED error',
    '3931': 'AUT_ERROR_LIMIT_EXCEEDED error', 
    '3932': 'AUT_ERROR_INSUFFICIENT_FUNDS error'
  };

  for (const [amount, description] of Object.entries(specialScenarios)) {
    // Create order with special amount (in PLN, will be converted to grosz)
    const specialOrder = await createTestOrderForBlik(user.id, `amount-${amount}`);
    if (specialOrder) {
      // Update order price to special amount
      await supabase
        .from('orders')
        .update({ price: parseFloat(amount) / 100 }) // Convert grosz to PLN
        .eq('id', specialOrder.id);
      
      specialOrder.price = parseFloat(amount) / 100;
      
      results.blik[`amount_${amount}`] = await testBlikPayment(
        specialOrder, 
        '777999', // Use positive code but special amount
        description
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  console.log('\n💳 Credits Payment:');
  if (results.credits) {
    console.log(`   Status: ${results.credits.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!results.credits.success) {
      console.log(`   Error: ${results.credits.error || 'Unknown error'}`);
    }
  }

  console.log('\n🏦 BLIK Payments:');
  let blikPassed = 0;
  let blikTotal = 0;
  
  for (const [code, result] of Object.entries(results.blik)) {
    blikTotal++;
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${code}: ${status}`);
    if (result.success) blikPassed++;
    if (!result.success && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  }

  console.log(`\n🎯 Final Results:`);
  console.log(`   Credits: ${results.credits?.success ? 'PASS' : 'FAIL'}`);
  console.log(`   BLIK: ${blikPassed}/${blikTotal} scenarios passed`);
  
  const overallSuccess = (results.credits?.success || false) && (blikPassed > 0);
  console.log(`   Overall: ${overallSuccess ? '✅ PAYMENT SYSTEM WORKING' : '⚠️ ISSUES DETECTED'}`);
}

runAllPaymentTests().catch(console.error);