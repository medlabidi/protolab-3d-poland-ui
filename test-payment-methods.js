const fetch = require('node-fetch');

const API_URL = '/api'; // Use the proxied API path
const CLIENT_URL = 'http://localhost:8080';

async function testCreditsPayment() {
  console.log('=== TESTING CREDITS PAYMENT ===');
  
  try {
    // First login to get a token
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@protolab.info', // Use your admin email
        password: 'admin123' // Use your admin password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login successful');

    // Create a test order first
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: 'test-credits.stl',
        fileSize: 1024,
        material: 'PLA',
        color: 'Black',
        quality: 'Standard',
        quantity: 1,
        price: 10.00 // Small test amount
      })
    });

    if (!orderResponse.ok) {
      console.log('❌ Order creation failed:', await orderResponse.text());
      return;
    }

    const order = await orderResponse.json();
    console.log('✅ Order created:', order.id);

    // Now test credits payment
    const creditsPaymentResponse = await fetch(`${API_URL}/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        payment_method: 'credits'
      })
    });

    if (creditsPaymentResponse.ok) {
      const result = await creditsPaymentResponse.json();
      console.log('✅ Credits payment successful');
      console.log('📦 Updated order:', result.id);
    } else {
      const error = await creditsPaymentResponse.text();
      console.log('❌ Credits payment failed:', error);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function testBlikPayment() {
  console.log('\n=== TESTING BLIK PAYMENT ===');
  
  try {
    // First login to get a token
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@protolab.info', // Use your admin email
        password: 'admin123' // Use your admin password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;

    // Create a test order first
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: 'test-blik.stl',
        fileSize: 1024,
        material: 'PLA',
        color: 'Black',
        quality: 'Standard',
        quantity: 1,
        price: 15.00 // Small test amount
      })
    });

    if (!orderResponse.ok) {
      console.log('❌ Order creation failed:', await orderResponse.text());
      return;
    }

    const order = await orderResponse.json();
    console.log('✅ Order created:', order.id);

    // Now test BLIK payment (this will just test the API call, not actual payment)
    const blikPaymentResponse = await fetch(`${API_URL}/payments/payu/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.price,
        description: `Test BLIK Payment - Order #${order.id}`,
        userId: order.user_id,
        payMethods: {
          payMethod: {
            type: 'PBL',
            value: 'blik',
            authorizationCode: '123456' // Test BLIK code
          }
        }
      })
    });

    if (blikPaymentResponse.ok) {
      const result = await blikPaymentResponse.json();
      console.log('✅ BLIK payment API call successful');
      console.log('📦 PayU Response:', result);
    } else {
      const error = await blikPaymentResponse.text();
      console.log('❌ BLIK payment failed:', error);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run tests
testCreditsPayment().then(() => {
  return testBlikPayment();
}).then(() => {
  console.log('\n=== TESTS COMPLETED ===');
});