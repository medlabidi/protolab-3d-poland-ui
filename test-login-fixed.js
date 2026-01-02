// Test login after fix
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testLoginAfterFix() {
  console.log('\n🔐 Testing Login After Fix...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const testEmail = 'med.labidi.mohamed@gmail.com';
  const testPassword = 'azerty123';
  
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}\n`);
  
  try {
    // Simulate the login flow from auth.service.ts
    const normalizedEmail = testEmail.toLowerCase().trim();
    
    // 1. Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();
    
    if (error || !user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('✅ Step 1: User found');
    
    // 2. Verify password
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    if (!isValidPassword) {
      console.error('❌ Step 2: Password verification FAILED');
      return;
    }
    console.log('✅ Step 2: Password verified');
    
    // 3. Check email verification
    if (!user.email_verified) {
      console.error('❌ Step 3: Email not verified');
      return;
    }
    console.log('✅ Step 3: Email verified');
    
    // 4. Success!
    console.log('\n🎉 LOGIN SUCCESSFUL!');
    console.log('\nUser Data:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('\n✅ Your login should work now in the app!\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testLoginAfterFix();
