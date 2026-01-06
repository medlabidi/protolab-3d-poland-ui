// Test script to check order details API
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function testOrderDetails() {
  console.log('\n🔍 Testing Order Details API\n');
  console.log('='.repeat(70));
  
  // You need to provide a valid access token and order ID
  const token = process.argv[2]; // Pass token as first argument
  const orderId = process.argv[3]; // Pass order ID as second argument
  
  if (!token || !orderId) {
    console.log('\n❌ Usage: node test-order-details.js <ACCESS_TOKEN> <ORDER_ID>');
    console.log('\nExample:');
    console.log('node test-order-details.js your-token-here order-id-here\n');
    return;
  }
  
  try {
    console.log(`\n📊 Fetching order: ${orderId}`);
    console.log('-'.repeat(70));
    
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.log(`\n❌ Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.log(JSON.stringify(errorData, null, 2));
      return;
    }
    
    const data = await response.json();
    const order = data.order;
    
    console.log('\n✅ Order Retrieved Successfully!\n');
    
    // Display all order parameters
    console.log('📦 ORDER INFORMATION');
    console.log('='.repeat(70));
    console.log(`Order ID:         ${order.id}`);
    console.log(`Status:           ${order.status}`);
    console.log(`Payment Status:   ${order.payment_status || 'N/A'}`);
    console.log(`Paid Amount:      ${order.paid_amount ? order.paid_amount + ' PLN' : 'N/A'}`);
    console.log(`Created At:       ${new Date(order.created_at).toLocaleString('fr-FR')}`);
    console.log(`Price:            ${order.price} PLN`);
    
    console.log('\n⚙️ PRINT PARAMETERS');
    console.log('='.repeat(70));
    console.log(`Material:         ${order.material?.toUpperCase()}`);
    console.log(`Color:            ${order.color}`);
    console.log(`Layer Height:     ${order.layer_height} mm`);
    console.log(`Infill:           ${order.infill}%`);
    console.log(`Quantity:         ${order.quantity}`);
    
    console.log('\n📄 FILE INFORMATION');
    console.log('='.repeat(70));
    console.log(`File Name:        ${order.file_name}`);
    console.log(`File URL:         ${order.file_url ? '✓ Available' : '✗ Not available'}`);
    
    console.log('\n🚚 SHIPPING DETAILS');
    console.log('='.repeat(70));
    console.log(`Shipping Method:  ${order.shipping_method}`);
    console.log(`Shipping Address: ${order.shipping_address || 'N/A'}`);
    console.log(`Tracking Code:    ${order.tracking_code || 'N/A'}`);
    
    console.log('\n📊 TECHNICAL DETAILS');
    console.log('='.repeat(70));
    console.log(`Material Weight:  ${order.material_weight ? (order.material_weight * 1000).toFixed(1) + 'g' : 'N/A'}`);
    console.log(`Print Time:       ${order.print_time ? Math.floor(order.print_time / 60) + 'h ' + (order.print_time % 60) + 'min' : 'N/A'}`);
    
    console.log('\n📝 ADDITIONAL INFO');
    console.log('='.repeat(70));
    console.log(`Notes:            ${order.notes || 'N/A'}`);
    console.log(`Review:           ${order.review || 'N/A'}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All parameters retrieved successfully!\n');
    
    // Check for missing data
    const missingFields = [];
    if (!order.file_url) missingFields.push('file_url');
    if (!order.material_weight) missingFields.push('material_weight');
    if (!order.print_time) missingFields.push('print_time');
    if (!order.tracking_code) missingFields.push('tracking_code');
    if (!order.shipping_address) missingFields.push('shipping_address');
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  OPTIONAL FIELDS NOT SET:');
      missingFields.forEach(field => console.log(`   - ${field}`));
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error fetching order:', error.message);
  }
}

testOrderDetails();
