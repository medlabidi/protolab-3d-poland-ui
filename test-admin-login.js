const fetch = require('node-fetch');
require('dotenv').config();

async function testAdminLogin() {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  console.log('\n🔐 Testing Admin Login...\n');
  console.log(`API URL: ${apiUrl}\n`);

  const credentials = {
    email: 'mahmoud@protolab.info',
    password: '000000'
  };

  try {
    console.log('📧 Email:', credentials.email);
    console.log('🔑 Password:', credentials.password);
    console.log('\n⏳ Sending login request...\n');

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('👤 User Details:');
      console.log('   ID:', data.user.id);
      console.log('   Name:', data.user.name);
      console.log('   Email:', data.user.email);
      console.log('   Role:', data.user.role);
      console.log('   Email Verified:', data.user.email_verified);
      console.log('\n🔑 Tokens:');
      console.log('   Access Token:', data.tokens.accessToken.substring(0, 20) + '...');
      console.log('   Refresh Token:', data.tokens.refreshToken.substring(0, 20) + '...');
    } else {
      console.log('❌ LOGIN FAILED!\n');
      console.log('Error:', data.error);
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminLogin();
