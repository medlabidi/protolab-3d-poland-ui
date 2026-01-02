const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testLoginErrors() {
  console.log('\n🧪 Testing Login Error Messages\n');

  // Test 1: Non-existent email
  console.log('Test 1: Non-existent email');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Error: ${data.error || data.message}`);
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }

  // Test 2: Wrong password
  console.log('\nTest 2: Wrong password (with existing email)');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'med35776@gmail.com',
        password: 'wrongpassword123'
      })
    });
    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Error: ${data.error || data.message}`);
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }

  // Test 3: Empty email
  console.log('\nTest 3: Empty email');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '',
        password: 'password123'
      })
    });
    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Error: ${data.error || data.message}`);
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }

  // Test 4: Malformed email
  console.log('\nTest 4: Malformed email');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'notanemail',
        password: 'password123'
      })
    });
    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Error: ${data.error || data.message}`);
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }

  console.log('\n✅ All tests completed\n');
}

testLoginErrors();
