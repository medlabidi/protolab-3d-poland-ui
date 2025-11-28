// Test login flow
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testLogin() {
  console.log('\n🔐 Testing Login Flow...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test with your email
  const testEmail = 'med.labidi.mohamed@gmail.com';
  const testPassword = 'test123'; // Update with your actual password
  
  console.log(`📧 Testing login for: ${testEmail}`);
  
  try {
    // Fetch user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (error) {
      console.error('❌ User not found:', error.message);
      return;
    }
    
    console.log('\n✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Email Verified:', user.email_verified);
    console.log('   Has password_hash:', !!user.password_hash);
    
    if (!user.password_hash) {
      console.error('\n❌ NO PASSWORD HASH FOUND!');
      console.log('   This user was likely created without a password');
      console.log('   You need to set a password for this account\n');
      return;
    }
    
    // Try to verify password
    console.log('\n🔑 Testing password verification...');
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect');
      console.log('   Either the password is wrong, or the hash is invalid');
    }
    
    // Check email verification
    if (!user.email_verified) {
      console.log('\n⚠️  Warning: Email not verified');
      console.log('   Login will fail with: "Please verify your email address first"');
    }
    
    console.log('\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testLogin();
