// Fix user account - set password and verify email
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixUserAccount() {
  console.log('\n🔧 Fix User Account Tool\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const email = await question('Enter your email: ');
  const newPassword = await question('Enter new password: ');
  
  console.log('\n⏳ Processing...\n');
  
  try {
    // Check if user exists
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (findError) {
      console.error('❌ User not found');
      rl.close();
      return;
    }
    
    // Hash the new password
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    // Update user: set password and verify email
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: password_hash,
        email_verified: true,
        verification_token: null,
        verification_token_expires: null
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      rl.close();
      return;
    }
    
    console.log('✅ Account fixed successfully!');
    console.log('   ✓ Password updated');
    console.log('   ✓ Email verified');
    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}\n`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  rl.close();
}

fixUserAccount();
