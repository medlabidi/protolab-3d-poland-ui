import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdminRole() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node set-admin-role.js <email>');
    process.exit(1);
  }
  
  try {
    // Find user by email
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (findError) {
      console.error('Error finding user:', findError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.error(`No user found with email: ${email}`);
      return;
    }
    
    const user = users[0];
    console.log('Found user:', user.email, 'Current role:', user.role || 'none');
    
    // Update to admin
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating role:', updateError);
      return;
    }
    
    console.log('✅ Successfully set admin role for:', updated.email);
    console.log('New role:', updated.role);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdminRole();
