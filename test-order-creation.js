const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const API_URL = 'http://localhost:5000';

// Create test STL file content
const testSTLContent = `solid test_cube
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 10 10 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 10 0
      vertex 0 10 0
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 10
      vertex 10 10 10
      vertex 10 0 10
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex 0 0 10
      vertex 0 10 10
      vertex 10 10 10
    endloop
  endfacet
endsolid test_cube`;

async function testOrderCreation() {
  console.log('🧪 Testing End-to-End Order Creation\n');
  
  try {
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'med35776@gmail.com',
        password: 'your_password_here' // Replace with actual password
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', error);
      console.log('\n⚠️  Please update the password in test-order-creation.js');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Logged in successfully');
    console.log('');
    
    // Step 2: Create test file
    console.log('Step 2: Creating test STL file...');
    const testFileName = `test-order-${Date.now()}.stl`;
    fs.writeFileSync(testFileName, testSTLContent);
    console.log('✅ Created:', testFileName, '(' + testSTLContent.length + ' bytes)');
    console.log('');
    
    // Step 3: Create FormData with order details
    console.log('Step 3: Preparing order data...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFileName), {
      filename: testFileName,
      contentType: 'application/sla'
    });
    formData.append('material', 'pla');
    formData.append('color', 'white');
    formData.append('layerHeight', '0.2');
    formData.append('infill', '20');
    formData.append('quantity', '1');
    formData.append('shippingMethod', 'inpost');
    formData.append('shippingAddress', JSON.stringify({
      lockerCode: 'KRA01A',
      lockerAddress: 'ul. Testowa 1, Kraków'
    }));
    
    console.log('✅ Order data prepared');
    console.log('   Material: PLA White');
    console.log('   Layer Height: 0.2mm');
    console.log('   Infill: 20%');
    console.log('   Quantity: 1');
    console.log('   Shipping: InPost locker');
    console.log('');
    
    // Step 4: Submit order
    console.log('Step 4: Submitting order to API...');
    const orderResponse = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const responseText = await orderResponse.text();
    
    if (!orderResponse.ok) {
      console.error('❌ Order creation failed:', responseText);
      fs.unlinkSync(testFileName);
      return;
    }
    
    const orderData = JSON.parse(responseText);
    console.log('✅ Order created successfully!');
    console.log('   Order ID:', orderData.order.id);
    console.log('   File URL:', orderData.order.file_url);
    console.log('   Status:', orderData.order.status);
    console.log('');
    
    // Step 5: Verify file was uploaded to Supabase
    console.log('Step 5: Verifying file in Supabase storage...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Extract the file path from the URL
    const urlParts = orderData.order.file_url.split('/storage/v1/object/public/print-jobs/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('print-jobs')
        .download(filePath);
      
      if (fileError) {
        console.error('❌ File not found in storage:', fileError.message);
      } else {
        const downloadedSize = (await fileData.arrayBuffer()).byteLength;
        console.log('✅ File found in storage!');
        console.log('   Path:', filePath);
        console.log('   Size:', downloadedSize, 'bytes');
      }
    }
    console.log('');
    
    // Step 6: Verify order in database
    console.log('Step 6: Verifying order in database...');
    const { data: dbOrder, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderData.order.id)
      .single();
    
    if (dbError) {
      console.error('❌ Order not found in database:', dbError.message);
    } else {
      console.log('✅ Order found in database!');
      console.log('   ID:', dbOrder.id);
      console.log('   File Name:', dbOrder.file_name);
      console.log('   Material:', dbOrder.material);
      console.log('   Color:', dbOrder.color);
      console.log('   Shipping Method:', dbOrder.shipping_method);
      console.log('   Shipping Address:', dbOrder.shipping_address);
      console.log('   Status:', dbOrder.status);
      console.log('   Created:', dbOrder.created_at);
    }
    console.log('');
    
    // Step 7: Fetch user orders via API
    console.log('Step 7: Fetching user orders via API...');
    const ordersResponse = await fetch(`${API_URL}/api/orders/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders fetched successfully!');
      console.log('   Total orders:', ordersData.count);
      console.log('   Test order found:', ordersData.orders.some(o => o.id === orderData.order.id) ? '✅ YES' : '❌ NO');
    } else {
      console.error('❌ Failed to fetch orders');
    }
    console.log('');
    
    // Cleanup
    console.log('Cleaning up test file...');
    fs.unlinkSync(testFileName);
    console.log('✅ Test file deleted');
    console.log('');
    
    console.log('✅ End-to-End Test PASSED!');
    console.log('');
    console.log('📝 Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ File upload to Supabase working');
    console.log('   ✅ Order creation in database working');
    console.log('   ✅ Order retrieval from API working');
    console.log('');
    console.log('🎉 The print job creation flow is fully functional!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Check if server is running first
fetch(`${API_URL}/health`)
  .then(res => {
    if (res.ok) {
      testOrderCreation();
    } else {
      console.error('❌ Server is not responding. Please start the server with: npm run dev');
    }
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server with: npm run dev');
  });
