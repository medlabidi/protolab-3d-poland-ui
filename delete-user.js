const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ejauqqpatmqbxxhbmkzp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYXVxcXBhdG1xYnh4aGJta3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDAzNDgxMSwiZXhwIjoyMDc5NjEwODExfQ.OM9oLqcUKOT9aDbboXYV_XRaDRWkWrjBm7E0vZbQQEo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteUser(email) {
  console.log(`\n🗑️  Deleting user: ${email}...`);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ User deleted successfully!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('\n❌ Please provide an email address');
  console.log('Usage: node delete-user.js email@example.com\n');
  process.exit(1);
}

deleteUser(email);
