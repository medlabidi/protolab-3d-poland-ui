import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminRole() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('\n=== ALL USERS ===');
    users.forEach(user => {
      console.log(`${user.email} - Role: ${user.role || 'NO ROLE SET'} - ID: ${user.id}`);
    });
    
    const adminUsers = users.filter(u => u.role === 'admin');
    console.log(`\n=== ADMIN USERS: ${adminUsers.length} ===`);
    adminUsers.forEach(user => {
      console.log(`${user.email} - ${user.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminRole();
