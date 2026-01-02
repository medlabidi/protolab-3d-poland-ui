// Simple Supabase connection test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabase() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Check your .env file\n');
    process.exit(1);
  }
  
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('\n⏳ Testing users table...');
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log(`📊 Users table exists with ${count} records`);
    
    if (data && data.length > 0) {
      console.log('\n👤 Sample user record:');
      console.log('   ID:', data[0].id);
      console.log('   Email:', data[0].email);
      console.log('   Name:', data[0].name);
      console.log('   Role:', data[0].role);
      console.log('   Email Verified:', data[0].email_verified);
    }
    
    console.log('\n✅ Database is connected and working!\n');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testSupabase();
