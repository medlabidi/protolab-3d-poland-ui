const fetch = require('node-fetch');

// Test signup endpoint
const API_URL = 'http://localhost:5000';

async function testSignup(email) {
  console.log('\n========================================');
  console.log('🧪 Testing Signup Flow');
  console.log('========================================\n');

  const testUser = {
    name: 'Test User',
    email: email,
    password: 'TestPassword123!',
    phone: '+48123456789',
    address: '123 Test Street',
    city: 'Warsaw',
    zipCode: '00-001',
    country: 'Poland',
    role: 'user'
  };

  console.log('📝 Test User Data:');
  console.log(JSON.stringify(testUser, null, 2));
  console.log('\n🔄 Sending signup request...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Signup completed successfully!');
      console.log('\n📧 Check your email inbox for:');
      console.log('   1. Registration confirmation email');
      console.log('   2. Verification email with link');
      console.log('\n⚠️  Also check your SPAM folder if you don\'t see the emails');
    } else {
      console.log('\n❌ FAILED! Signup failed');
      console.log('Error:', data.error || data.message);
    }

  } catch (error) {
    console.log('\n❌ ERROR: Connection failed');
    console.error('Error details:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
  }

  console.log('\n========================================\n');
}

// Get email from command line or prompt for it
const email = process.argv[2];

if (!email) {
  console.log('\n❌ Please provide an email address as argument');
  console.log('Usage: node test-signup.js your-email@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.log('\n❌ Invalid email format');
  process.exit(1);
}

testSignup(email);
