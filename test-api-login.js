// Test the actual login API endpoint
const fetch = require('node-fetch');

async function testLoginAPI() {
  console.log('\n🌐 Testing Login API Endpoint...\n');
  
  const API_URL = 'http://localhost:5000';
  const email = 'med.labidi.mohamed@gmail.com';
  const password = 'azerty123';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🔗 Endpoint: ${API_URL}/api/auth/login\n`);
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('\n❌ Login Failed!');
      console.error('Error:', data.error || data.message || 'Unknown error');
      console.log('\nFull Response:', JSON.stringify(data, null, 2));
      return;
    }
    
    console.log('\n✅ Login Successful!\n');
    console.log('User:');
    console.log('   ID:', data.user.id);
    console.log('   Name:', data.user.name);
    console.log('   Email:', data.user.email);
    console.log('   Role:', data.user.role);
    
    console.log('\nTokens:');
    console.log('   Access Token:', data.tokens.accessToken.substring(0, 30) + '...');
    console.log('   Refresh Token:', data.tokens.refreshToken.substring(0, 30) + '...');
    
    console.log('\n🎉 Your login is working perfectly!\n');
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.error('   Make sure the server is running on http://localhost:5000');
  }
}

testLoginAPI();
