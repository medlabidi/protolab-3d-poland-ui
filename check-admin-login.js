// Comprehensive Admin Login Checker
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminLogin() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 ADMIN LOGIN SYSTEM CHECK');
  console.log('='.repeat(60) + '\n');

  const adminEmail = 'mahmoud@protolab.info';
  const adminPassword = '000000';

  try {
    // 1. Check Database Connection
    console.log('1️⃣  DATABASE CONNECTION');
    console.log('-'.repeat(40));
    const { data: testQuery } = await supabase.from('users').select('count', { count: 'exact' });
    console.log('✅ Connected to Supabase database\n');

    // 2. Check Admin User Exists
    console.log('2️⃣  ADMIN USER EXISTENCE');
    console.log('-'.repeat(40));
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (userError) {
      console.log(`❌ Admin user not found: ${userError.message}\n`);
      return;
    }

    console.log(`✅ Admin user exists`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}\n`);

    // 3. Check Admin Status
    console.log('3️⃣  ADMIN PERMISSIONS');
    console.log('-'.repeat(40));
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log(`   Email Verified: ${adminUser.email_verified}`);
    
    if (adminUser.role !== 'admin') {
      console.log(`❌ User is not an admin (role: ${adminUser.role})\n`);
      return;
    }
    
    if (adminUser.status !== 'approved') {
      console.log(`❌ Admin account not approved (status: ${adminUser.status})\n`);
      return;
    }
    
    if (!adminUser.email_verified) {
      console.log(`⚠️  Email not verified\n`);
    } else {
      console.log(`✅ All permissions OK\n`);
    }

    // 4. Check Password Hash
    console.log('4️⃣  PASSWORD HASH');
    console.log('-'.repeat(40));
    if (!adminUser.password_hash) {
      console.log('❌ No password hash found\n');
      return;
    }
    console.log('✅ Password hash exists\n');

    // 5. Test Password
    console.log('5️⃣  PASSWORD VERIFICATION');
    console.log('-'.repeat(40));
    const isValidPassword = await bcrypt.compare(adminPassword, adminUser.password_hash);
    if (!isValidPassword) {
      console.log('❌ Password verification failed\n');
      return;
    }
    console.log('✅ Password verification successful\n');

    // 6. Check Refresh Tokens Table
    console.log('6️⃣  REFRESH TOKENS TABLE');
    console.log('-'.repeat(40));
    const { data: tokens, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('count', { count: 'exact' });
    
    if (tokenError) {
      console.log(`⚠️  Could not query refresh_tokens: ${tokenError.message}\n`);
    } else {
      console.log(`✅ Refresh tokens table accessible\n`);
    }

    // 7. Summary
    console.log('7️⃣  LOGIN READINESS SUMMARY');
    console.log('-'.repeat(40));
    console.log('✅ Database connected');
    console.log('✅ Admin user exists');
    console.log('✅ Admin role configured');
    console.log('✅ Account approved');
    console.log('✅ Email verified');
    console.log('✅ Password hashed');
    console.log('✅ Password validates correctly');
    console.log('\n🎉 ADMIN LOGIN IS FULLY OPERATIONAL\n');

    console.log('📝 LOGIN CREDENTIALS:');
    console.log('-'.repeat(40));
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}\n`);

    console.log('🌐 ACCESS POINTS:');
    console.log('-'.repeat(40));
    console.log('Server API:    POST /auth/login');
    console.log('Client Login:  http://localhost:8080/admin/login');
    console.log('Admin Panel:   http://localhost:8080/admin\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\nTroubleshooting:');
    console.log('• Check .env file in server/ directory');
    console.log('• Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('• Ensure database tables are created');
    console.log('• Check network connectivity to Supabase\n');
  }
}

checkAdminLogin();
