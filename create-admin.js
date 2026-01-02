const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const email = 'mahmoud@protolab.info';
  const password = '000000';
  const name = 'Mahmoud Admin';

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing user to admin
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          password_hash: passwordHash,
          email_verified: true,
          status: 'approved'
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ User updated to admin:', data.email);
    } else {
      // Create new admin user
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: name,
          email: email,
          password_hash: passwordHash,
          role: 'admin',
          email_verified: true,
          status: 'approved'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Admin user created:', data.email);
    }

    console.log('\n📧 Email:', email);
    console.log('🔐 Password:', password);
    console.log('👤 Role: admin');
    console.log('\nYou can now login at: http://localhost:8080/admin/login?key=mokded-kassem-1997');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminUser();
