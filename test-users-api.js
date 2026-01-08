// Test script for Admin Users API
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const API_URL = 'http://localhost:3000/api';

async function testUsersAPI() {
  console.log('\n🧪 Testing Admin Users API...\n');

  if (!ADMIN_TOKEN) {
    console.log('⚠️  No ADMIN_TOKEN provided - Testing without authentication');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(ADMIN_TOKEN && { 'Authorization': `Bearer ${ADMIN_TOKEN}` }),
  };

  try {
    // Test 1: GET all users
    console.log('1️⃣  Testing GET /api/admin/users...');
    const getResponse = await fetch(`${API_URL}/admin/users`, { headers });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   ✅ Success: Found ${data.users?.length || 0} users`);
      if (data.users?.length > 0) {
        console.log(`   📋 Sample user: ${data.users[0].name} (${data.users[0].email})`);
      }
    } else {
      const error = await getResponse.json();
      console.log(`   ❌ Error ${getResponse.status}: ${error.error}`);
      
      if (getResponse.status === 401) {
        console.log('   💡 Tip: Set ADMIN_TOKEN environment variable');
        console.log('      Example: $env:ADMIN_TOKEN="your-token-here"; node test-users-api.js');
      }
      
      if (getResponse.status === 403) {
        console.log('   💡 Tip: Token must be from an admin user');
      }
    }

    // Test 2: Check if server is running
    console.log('\n2️⃣  Testing server availability...');
    try {
      await fetch(`${API_URL}/health`);
      console.log('   ✅ Server is running');
    } catch (err) {
      console.log('   ❌ Server not responding');
      console.log('   💡 Start server: npm run dev');
    }

    // Test 3: Check Supabase connection
    console.log('\n3️⃣  Testing Supabase connection...');
    if (!process.env.VITE_SUPABASE_URL) {
      console.log('   ❌ Missing VITE_SUPABASE_URL');
    } else {
      console.log('   ✅ Supabase URL configured');
    }

    if (!process.env.VITE_SUPABASE_ANON_KEY) {
      console.log('   ❌ Missing VITE_SUPABASE_ANON_KEY');
    } else {
      console.log('   ✅ Supabase key configured');
    }

    console.log('\n📝 Summary:');
    console.log('   - API Endpoint: /api/admin/users');
    console.log('   - Methods: GET (list), POST (create), PATCH (update), DELETE (remove)');
    console.log('   - Authentication: Bearer token required (admin role)');
    
    console.log('\n🛠️  Next steps:');
    console.log('   1. Ensure dev server is running: npm run dev');
    console.log('   2. Login as admin to get token');
    console.log('   3. Navigate to: http://localhost:5173/admin/users');
    console.log('   4. Test CRUD operations from the UI');

  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
    console.log('\n🛠️  Troubleshooting:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Check .env file has Supabase credentials');
    console.log('   3. Ensure users table exists in Supabase');
  }
}

// Run test
testUsersAPI().catch(console.error);
