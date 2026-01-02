const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBalanceAfterSubmission() {
  console.log('💰 CHECKING BALANCE AFTER PAYMENT SUBMISSION');
  console.log('============================================');
  
  try {
    // Find test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'test@protolab.com')
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found:', userError);
      return;
    }

    console.log('👤 User:', user.email);
    console.log('🆔 User ID:', user.id);

    // Check current credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      console.log('❌ Credits lookup error:', creditsError);
      return;
    }

    console.log('\n💳 CURRENT CREDITS:');
    console.log('Balance:', credits.balance, 'PLN');
    console.log('Last updated:', credits.updated_at);

    // Check recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('credits_transactions')
      .select('amount, type, description, created_at, balance_after, order_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (txError) {
      console.log('❌ Transactions lookup error:', txError);
    } else {
      console.log('\n📊 RECENT TRANSACTIONS:');
      if (transactions.length === 0) {
        console.log('No transactions found');
      } else {
        transactions.forEach((tx, index) => {
          const date = new Date(tx.created_at).toLocaleString();
          console.log(`${index + 1}. ${tx.type.toUpperCase()}: ${tx.amount} PLN`);
          console.log(`   Description: ${tx.description}`);
          console.log(`   Date: ${date}`);
          console.log(`   Balance after: ${tx.balance_after} PLN`);
          if (tx.order_id) console.log(`   Order ID: ${tx.order_id}`);
          console.log('');
        });
      }
    }

    // Check test order status
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, payment_status, payment_method, price, paid_amount, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.log('❌ Orders lookup error:', ordersError);
    } else {
      console.log('📦 RECENT ORDERS:');
      if (orders.length === 0) {
        console.log('No orders found');
      } else {
        orders.forEach((order, index) => {
          const date = new Date(order.created_at).toLocaleString();
          console.log(`${index + 1}. Order: ${order.id}`);
          console.log(`   Payment Status: ${order.payment_status}`);
          console.log(`   Payment Method: ${order.payment_method || 'Not set'}`);
          console.log(`   Price: ${order.price} PLN`);
          console.log(`   Paid Amount: ${order.paid_amount || 'Not paid'} PLN`);
          console.log(`   Created: ${date}`);
          console.log('');
        });
      }
    }

    // Summary
    console.log('🔍 SUMMARY:');
    console.log(`Current Balance: ${credits.balance} PLN`);
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Total Orders: ${orders.length}`);
    
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const pendingOrders = orders.filter(o => o.payment_status === 'on_hold');
    console.log(`Paid Orders: ${paidOrders.length}`);
    console.log(`Pending Orders: ${pendingOrders.length}`);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkBalanceAfterSubmission().catch(console.error);