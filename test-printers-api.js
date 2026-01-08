// Test script for Printers API
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

async function testPrintersAPI() {
  console.log('🧪 Testing Printers API...\n');
  
  // Get token from environment or use anonymous test
  const token = process.env.ADMIN_TOKEN;
  
  if (!token) {
    console.log('⚠️  No ADMIN_TOKEN provided - Testing without authentication');
    console.log('   To test with authentication:');
    console.log('   1. Login as admin on http://localhost:5173/admin/login');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Run: localStorage.accessToken');
    console.log('   4. Copy the token');
    console.log('   5. Run: $env:ADMIN_TOKEN="your-token"; node test-printers-api.js');
    console.log('');
  }
  
  try {
    console.log(`📍 API URL: ${API_URL}/printers`);
    if (token) {
      console.log(`🔑 Using token: ${token.substring(0, 20)}...`);
    } else {
      console.log('🔓 No authentication (testing endpoint availability)');
    }
    console.log('');
    
    // Test 1: GET all printers
    console.log('1️⃣  Testing GET /api/printers...');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/printers`, {
      method: 'GET',
      headers: headers,
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success! Found ${data.printers?.length || 0} printers`);
      
      if (data.printers && data.printers.length > 0) {
        console.log('\n   📋 Printers:');
        data.printers.forEach((printer, i) => {
          console.log(`   ${i + 1}. ${printer.name} (${printer.status})`);
          console.log(`      - Temperature: ${printer.temperature}°C`);
          console.log(`      - Maintenance Cost: ${printer.maintenance_cost_monthly || 0} PLN/month`);
        });
      }
      
      return data.printers;
    } else {
      const error = await response.json().catch(() => ({}));
      console.log(`   ❌ Error: ${error.error || response.statusText}`);
      console.log('');
      
      // Diagnostic tips
      console.log('🔍 Troubleshooting:');
      if (response.status === 401) {
        if (!token) {
          console.log('   - No token provided (expected for public test)');
          console.log('   - Admin endpoints require authentication');
        } else {
          console.log('   - Your token might be expired or invalid');
          console.log('   - Try logging in again as admin');
        }
      } else if (response.status === 403) {
        console.log('   - Your account might not have admin privileges');
        console.log('   - Check users table: role should be "admin"');
      } else if (response.status === 500) {
        console.log('   - Database error - check if printers table exists');
        console.log('   - Run: SQL/create-printers-table.sql in Supabase');
      } else if (response.status === 404) {
        console.log('   - API endpoint not found');
        console.log('   - Verify the API URL is correct');
        console.log('   - Check if api/printers/index.ts exists');
      }
      
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   - Check if the API server is running');
    console.log('   - Verify VITE_API_URL in .env file');
    console.log('   - Check CORS settings');
    return null;
  }
}

// Test 2: Check Supabase connection
async function testSupabaseConnection() {
  console.log('\n2️⃣  Testing Supabase Connection...');
  
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('   ❌ Missing Supabase credentials');
    console.log('   - Check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/printers?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (response.ok) {
      console.log('   ✅ Supabase connection OK');
    } else if (response.status === 404) {
      console.log('   ⚠️  Printers table not found in Supabase');
      console.log('   - Run SQL/create-printers-table.sql in Supabase SQL Editor');
    } else {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
  }
}

// Run tests
(async () => {
  const printers = await testPrintersAPI();
  await testSupabaseConnection();
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 Summary:');
  console.log('='.repeat(60));
  
  if (printers && printers.length > 0) {
    console.log('✅ API is working correctly!');
    console.log(`   ${printers.length} printer(s) found`);
  } else if (printers !== null && printers.length === 0) {
    console.log('⚠️  API works but no printers found');
    console.log('\n🛠️  Next steps:');
    console.log('   1. Run SQL/create-printers-table.sql in Supabase');
    console.log('   2. Or add printers via /admin/printers page');
  } else {
    console.log('❌ API test failed');
    console.log('\n🛠️  Next steps:');
    console.log('   1. Ensure server is running: npm run dev');
    console.log('   2. Check .env configuration');
    if (!process.env.ADMIN_TOKEN) {
      console.log('   3. Get admin token and retry:');
      console.log('      $env:ADMIN_TOKEN="your-token"; node test-printers-api.js');
    } else {
      console.log('   3. Verify token is valid and user is admin');
    }
  }
  console.log('');
})();
