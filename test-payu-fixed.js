const axios = require('axios');

const API_BASE = 'https://protolabb-mfpdvmxbl-med-labidis-projects.vercel.app';

async function testPayUPayment() {
  try {
    console.log('🧪 Testing PayU payment flow...');
    
    const paymentData = {
      orderId: `test-order-${Date.now()}`,
      amount: 5000, // 50.00 PLN
      description: 'Test 3D Print Order',
      userId: 'test-user-123',
      payMethods: {
        payMethod: {
          type: 'PBL', 
          value: 'blik'
        }
      }
    };
    
    console.log('\n📝 Payment request data:', paymentData);
    
    const response = await axios.post(`${API_BASE}/api/payments/payu/create`, paymentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ PayU Response:', response.status, response.statusText);
    console.log('Response data:', response.data);
    
    if (response.data.htmlContent) {
      console.log('🎯 HTML content received successfully');
      console.log('HTML length:', response.data.htmlContent.length);
      
      // Check if assets are properly fixed
      const hasAbsolutePaths = response.data.htmlContent.includes('https://secure.snd.payu.com/');
      console.log('🔧 Asset URLs fixed:', hasAbsolutePaths);
    }
    
  } catch (error) {
    console.error('\n❌ PayU payment test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testPayUPayment();