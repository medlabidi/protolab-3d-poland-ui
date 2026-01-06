#!/usr/bin/env node

const http = require('http');

const credentials = {
  email: 'mahmoud@protolab.info',
  password: '000000'
};

console.log('\n\n╔════════════════════════════════════════════════════════╗');
console.log('║         🔐 ADMIN LOGIN TEST - PROTOLAB 3D             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📧 Email:    ' + credentials.email);
console.log('🔑 Password: ' + '*'.repeat(credentials.password.length));
console.log('🌐 Server:   http://localhost:5000\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const payload = JSON.stringify(credentials);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'ProtoLab-Admin-Test/1.0'
  },
  timeout: 5000
};

const request = http.request(options, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    displayResults(response.statusCode, data);
  });
});

request.on('timeout', () => {
  console.log('❌ ERROR: Request timeout (5 seconds)');
  console.log('⚠️  Make sure the server is running on port 5000\n');
  process.exit(1);
});

request.on('error', (error) => {
  console.log('❌ CONNECTION ERROR:', error.message);
  console.log('\n⚠️  Server is not running. Start it with:');
  console.log('    npm run dev:server\n');
  process.exit(1);
});

request.write(payload);
request.end();

function displayResults(statusCode, responseData) {
  try {
    const response = JSON.parse(responseData);

    if (statusCode === 200 || statusCode === 201) {
      console.log('✅ LOGIN SUCCESSFUL\n');
      
      console.log('👤 USER INFORMATION:');
      console.log(`   ID:    ${response.user?.id || 'N/A'}`);
      console.log(`   Email: ${response.user?.email || 'N/A'}`);
      console.log(`   Role:  ${response.user?.role || 'N/A'}\n`);

      console.log('🔑 TOKENS:');
      if (response.accessToken) {
        console.log(`   ✅ Access Token:  ${response.accessToken.substring(0, 50)}...`);
        console.log(`      Length: ${response.accessToken.length} chars`);
        console.log(`      Type: JWT`);
      } else {
        console.log('   ❌ Access Token: Missing');
      }

      if (response.refreshToken) {
        console.log(`   ✅ Refresh Token: ${response.refreshToken.substring(0, 50)}...`);
        console.log(`      Length: ${response.refreshToken.length} chars`);
      } else {
        console.log('   ❌ Refresh Token: Missing');
      }

      console.log('\n🎯 NEXT STEPS:');
      console.log('   1. Open browser: http://localhost:8080/admin/login');
      console.log('   2. Enter credentials:');
      console.log(`      Email: ${credentials.email}`);
      console.log(`      Password: ${credentials.password}`);
      console.log('   3. Access dashboard: http://localhost:8080/admin\n');

      console.log('📊 AVAILABLE PAGES:');
      console.log('   • Dashboard     → /admin');
      console.log('   • Orders        → /admin/orders');
      console.log('   • Users         → /admin/users');
      console.log('   • Printers      → /admin/printers');
      console.log('   • Materials     → /admin/materials');
      console.log('   • Analytics     → /admin/analytics');
      console.log('   • Reports       → /admin/reports');
      console.log('   • Notifications → /admin/notifications');
      console.log('   • Settings      → /admin/settings\n');

    } else if (statusCode === 401) {
      console.log('❌ LOGIN FAILED - Invalid Credentials\n');
      console.log('Error:', response.message || 'Unauthorized');
      console.log('\n💡 Check:');
      console.log('   • Email is correct: mahmoud@protolab.info');
      console.log('   • Password is correct: 000000');
      console.log('   • User exists in database\n');
    } else {
      console.log(`❌ LOGIN FAILED - HTTP ${statusCode}\n`);
      console.log('Error:', response.message || response.error);
      console.log('Full Response:', JSON.stringify(response, null, 2), '\n');
    }
  } catch (error) {
    console.log('❌ ERROR: Could not parse response\n');
    console.log('Details:', error.message);
    console.log('Response:', responseData, '\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
