import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Use production credentials directly
const supabaseUrl = 'https://ejauqqpatmqbxxhbmkzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYXVxcXBhdG1xYnh4aGJta3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDAzNDgxMSwiZXhwIjoyMDc5NjEwODExfQ.OM9oLqcUKOT9aDbboXYV_XRaDRWkWrjBm7E0vZbQQEo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVerifiedTestUser() {
  const email = 'test@protolab.info';
  const password = 'Test123!';
  const name = 'Test User';
  
  console.log('Creating verified test user...');
  console.log('Email:', email);
  console.log('Password:', password);
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, email_verified')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    console.log('User already exists:', existingUser);
    
    // Update to make sure it's verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        status: 'approved',
        verification_token: null,
        verification_token_expires: null
      })
      .eq('id', existingUser.id);
    
    if (updateError) {
      console.error('Failed to update user:', updateError);
    } else {
      console.log('✅ User updated - email verified!');
    }
    return;
  }
  
  // Create new user
  const passwordHash = await bcrypt.hash(password, 10);
  
  const { data: user, error } = await supabase
    .from('users')
    .insert([{
      email: email,
      password_hash: passwordHash,
      name: name,
      role: 'user',
      email_verified: true,
      status: 'approved',
      verification_token: null,
      verification_token_expires: null
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }
  
  console.log('✅ Test user created successfully!');
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Password:', password);
  console.log('Email Verified:', user.email_verified);
}

createVerifiedTestUser();
