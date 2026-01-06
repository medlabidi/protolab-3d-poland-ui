#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL);
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSupabaseData() {
  console.log('\n📊 CHECKING SUPABASE DATABASE\n');
  console.log('URL:', SUPABASE_URL);
  console.log('---\n');

  try {
    // Check users
    console.log('👥 USERS TABLE:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('   ❌ Error:', usersError.message);
    } else {
      console.log(`   ✅ Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (Role: ${user.role}, Verified: ${user.email_verified})`);
        });
      }
    }

    console.log('\n📦 ORDERS TABLE:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.log('   ❌ Error:', ordersError.message);
    } else {
      console.log(`   ✅ Found ${orders?.length || 0} orders`);
      if (orders && orders.length > 0) {
        const statuses = {};
        orders.forEach(order => {
          statuses[order.status] = (statuses[order.status] || 0) + 1;
        });
        console.log('   Status breakdown:');
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`     - ${status}: ${count}`);
        });
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        console.log(`   Total Revenue: ${totalRevenue.toFixed(2)} PLN`);
      }
    }

    console.log('\n🎨 DESIGN_REQUESTS TABLE:');
    const { data: designs, error: designsError } = await supabase
      .from('design_requests')
      .select('*');
    
    if (designsError) {
      console.log('   ❌ Error:', designsError.message);
    } else {
      console.log(`   ✅ Found ${designs?.length || 0} design requests`);
      if (designs && designs.length > 0) {
        const statuses = {};
        designs.forEach(design => {
          statuses[design.status] = (statuses[design.status] || 0) + 1;
        });
        console.log('   Status breakdown:');
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`     - ${status}: ${count}`);
        });
      }
    }

    console.log('\n🔑 REFRESH_TOKENS TABLE:');
    const { data: tokens, error: tokensError } = await supabase
      .from('refresh_tokens')
      .select('*');
    
    if (tokensError) {
      console.log('   ❌ Error:', tokensError.message);
    } else {
      console.log(`   ✅ Found ${tokens?.length || 0} active refresh tokens`);
    }

    console.log('\n📋 APPOINTMENTS TABLE:');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*');
    
    if (appointmentsError) {
      console.log('   ❌ Error:', appointmentsError.message);
    } else {
      console.log(`   ✅ Found ${appointments?.length || 0} appointments`);
      if (appointments && appointments.length > 0) {
        const statuses = {};
        appointments.forEach(apt => {
          statuses[apt.status] = (statuses[apt.status] || 0) + 1;
        });
        console.log('   Status breakdown:');
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`     - ${status}: ${count}`);
        });
      }
    }

    console.log('\n📝 MATERIALS TABLE:');
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*');
    
    if (materialsError) {
      console.log('   ❌ Error:', materialsError.message);
    } else {
      console.log(`   ✅ Found ${materials?.length || 0} materials`);
      if (materials && materials.length > 0) {
        materials.forEach((mat, i) => {
          console.log(`   ${i + 1}. ${mat.name} - Stock: ${mat.stock_quantity} kg (Price: ${mat.price_per_kg} PLN/kg)`);
        });
      }
    }

    console.log('\n🖨️ PRINTERS TABLE:');
    const { data: printers, error: printersError } = await supabase
      .from('printers')
      .select('*');
    
    if (printersError) {
      console.log('   ❌ Error:', printersError.message);
    } else {
      console.log(`   ✅ Found ${printers?.length || 0} printers`);
      if (printers && printers.length > 0) {
        printers.forEach((printer, i) => {
          console.log(`   ${i + 1}. ${printer.name} - Status: ${printer.status} (Uptime: ${printer.uptime_hours || 0}h)`);
        });
      }
    }

    console.log('\n💰 PAYMENTS TABLE:');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*');
    
    if (paymentsError) {
      console.log('   ❌ Error:', paymentsError.message);
    } else {
      console.log(`   ✅ Found ${payments?.length || 0} payments`);
      if (payments && payments.length > 0) {
        const statuses = {};
        payments.forEach(payment => {
          statuses[payment.status] = (statuses[payment.status] || 0) + 1;
        });
        console.log('   Status breakdown:');
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`     - ${status}: ${count}`);
        });
      }
    }

    console.log('\n📌 NOTIFICATIONS TABLE:');
    const { data: notifs, error: notifsError } = await supabase
      .from('notifications')
      .select('*');
    
    if (notifsError) {
      console.log('   ❌ Error:', notifsError.message);
    } else {
      console.log(`   ✅ Found ${notifs?.length || 0} notifications`);
    }

    console.log('\n\n✅ SUPABASE DATA CHECK COMPLETE\n');

  } catch (error) {
    console.error('❌ Error checking Supabase data:', error.message);
    process.exit(1);
  }
}

checkSupabaseData();
