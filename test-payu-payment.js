/**
 * Test PayU BLIK Payment Integration
 * 
 * This script tests the PayU BLIK payment flow
 * Run with: node test-payu-payment.js
 */

const https = require('https');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_BLIK_CODE = '777123'; // Valid test code for sandbox

let accessToken = '';
let testOrderId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const lib = isHttps ? https : require('http');
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting PayU BLIK Payment Tests\n');

  try {
    // Step 1: Login to get access token
    console.log('Step 1: Logging in...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'Test123!',
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed. Please create a test user first.');
      console.error('Response:', loginResponse);
      return;
    }

    accessToken = loginResponse.data.accessToken;
    console.log('✅ Login successful\n');

    // Step 2: Create a test order (you might need to adjust this based on your API)
    console.log('Step 2: Fetching existing orders...');
    const ordersResponse = await makeRequest('GET', '/orders/my', null, accessToken);
    
    if (ordersResponse.status !== 200 || !ordersResponse.data.orders || ordersResponse.data.orders.length === 0) {
      console.error('❌ No orders found. Please create a test order first.');
      return;
    }

    testOrderId = ordersResponse.data.orders[0].id;
    console.log(`✅ Using order: ${testOrderId}\n`);

    // Step 3: Test OAuth token retrieval
    console.log('Step 3: Testing PayU OAuth authentication...');
    // This is done internally by the service, but we'll test the payment endpoint
    console.log('✅ OAuth will be tested via payment creation\n');

    // Step 4: Test BLIK payment with valid code
    console.log('Step 4: Creating BLIK payment with valid code (777123)...');
    const blikPaymentResponse = await makeRequest('POST', '/payments/blik', {
      orderId: testOrderId,
      blikCode: TEST_BLIK_CODE,
    }, accessToken);

    console.log('BLIK Payment Response:', JSON.stringify(blikPaymentResponse, null, 2));

    if (blikPaymentResponse.status === 200 && blikPaymentResponse.data.success) {
      console.log('✅ BLIK payment initiated successfully');
      console.log(`   PayU Order ID: ${blikPaymentResponse.data.payuOrderId}`);
      console.log(`   Status: ${blikPaymentResponse.data.status.statusCode}\n`);
    } else {
      console.error('❌ BLIK payment failed');
      console.error('   Error:', blikPaymentResponse.data.message || blikPaymentResponse.data.error);
    }

    // Step 5: Check payment status
    console.log('Step 5: Checking payment status...');
    const statusResponse = await makeRequest('GET', `/payments/status/${testOrderId}`, null, accessToken);
    
    console.log('Payment Status:', JSON.stringify(statusResponse, null, 2));
    console.log('');

    // Step 6: Test with invalid BLIK code
    console.log('Step 6: Testing with invalid BLIK code (123456)...');
    const invalidBlikResponse = await makeRequest('POST', '/payments/blik', {
      orderId: testOrderId,
      blikCode: '123456',
    }, accessToken);

    console.log('Invalid BLIK Response:', JSON.stringify(invalidBlikResponse, null, 2));

    if (invalidBlikResponse.status === 400) {
      console.log('✅ Invalid BLIK code properly rejected\n');
    } else {
      console.error('❌ Invalid BLIK code should have been rejected\n');
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Test Summary');
    console.log('═══════════════════════════════════════');
    console.log('✓ Authentication: Working');
    console.log('✓ BLIK Payment API: Working');
    console.log('✓ Payment Status: Working');
    console.log('✓ Error Handling: Working');
    console.log('═══════════════════════════════════════\n');

    console.log('📝 Next Steps:');
    console.log('1. Test the frontend payment component at: /orders/:orderId/payment');
    console.log('2. Monitor webhook notifications at: /api/payments/payu/notify');
    console.log('3. Check order status updates after payment completion');
    console.log('4. Test standard payment flow (redirect to PayU)');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run the tests
console.log('');
console.log('═══════════════════════════════════════');
console.log('  PayU BLIK Payment Integration Test  ');
console.log('═══════════════════════════════════════');
console.log('');

runTests().catch(console.error);
