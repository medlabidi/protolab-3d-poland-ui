const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserCredits() {
  console.log('=== CHECKING USER CREDITS ===');
  
  try {
    // Find admin user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(10); // Get all users to see what's available
    
    if (userError) {
      console.log('❌ User lookup error:', userError);
      return;
    }
    
    console.log('👤 Found users:', users.length);
    users.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'})`));
    
    if (!users || users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const user = users[0];
    console.log('✅ Found user:', user.email, user.name);
    
    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .single();
    
    if (creditsError) {
      console.log('❌ Credits lookup error:', creditsError);
      return;
    }
    
    if (!credits) {
      console.log('🚫 No credits record found for user');
    } else {
      console.log('💰 Current balance:', credits.balance, 'PLN');
      console.log('📅 Last updated:', credits.updated_at);
    }
    
    // Check recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('credits_transactions')
      .select('amount, type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (txError) {
      console.log('❌ Transactions lookup error:', txError);
    } else {
      console.log('\n📊 Recent transactions:');
      transactions.forEach(tx => {
        console.log(`  ${tx.type}: ${tx.amount} PLN - ${tx.description} (${tx.created_at})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function addTestCredits() {
  console.log('\n=== ADDING TEST CREDITS ===');
  
  try {
    // Find admin user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'admin@protolab.info');
    
    if (userError || !users || users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    
    // Add 50 PLN for testing
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({
        user_id: user.id,
        balance: 50.00,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (updateError) {
      console.log('❌ Failed to add credits:', updateError);
    } else {
      console.log('✅ Added 50 PLN test credits');
      
      // Add transaction record
      const { error: txError } = await supabase
        .from('credits_transactions')
        .insert({
          user_id: user.id,
          amount: 50.00,
          type: 'credit',
          description: 'Test credits for payment testing',
          balance_after: 50.00
        });
      
      if (txError) {
        console.log('⚠️ Transaction record failed:', txError);
      } else {
        console.log('✅ Transaction record created');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the checks
checkUserCredits()
  .then(() => addTestCredits())
  .then(() => checkUserCredits())
  .then(() => console.log('\n=== COMPLETE ==='));