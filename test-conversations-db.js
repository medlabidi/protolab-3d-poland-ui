#!/usr/bin/env node

/**
 * Test script to verify conversations database tables exist
 */

require('dotenv').config({ path: './server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConversationsTables() {
  console.log('\n🧪 Testing Conversations Database Tables\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check conversations table
    console.log('\n[TEST 1] Checking conversations table...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      if (convError.code === '42P01') {
        console.error('❌ conversations table does NOT exist');
        console.log('   Run: SQL/add-conversations-table.sql in Supabase');
      } else {
        console.error(`❌ Error: ${convError.message}`);
      }
    } else {
      console.log(`✓ conversations table exists (found ${conversations?.length || 0} records)`);
    }

    // Test 2: Check conversation_messages table
    console.log('\n[TEST 2] Checking conversation_messages table...');
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(1);

    if (msgError) {
      if (msgError.code === '42P01') {
        console.error('❌ conversation_messages table does NOT exist');
        console.log('   Run: SQL/add-conversations-table.sql in Supabase');
      } else {
        console.error(`❌ Error: ${msgError.message}`);
      }
    } else {
      console.log(`✓ conversation_messages table exists (found ${messages?.length || 0} records)`);
    }

    // Test 3: Try to fetch a sample conversation with messages
    console.log('\n[TEST 3] Testing conversation query with joins...');
    const { data: testConv, error: testError } = await supabase
      .from('conversations')
      .select(`
        *,
        users:user_id(id, name, email),
        orders:order_id(id, file_name)
      `)
      .limit(1);

    if (testError) {
      console.error(`❌ Join query failed: ${testError.message}`);
    } else {
      console.log(`✓ Join query works (${testConv?.length || 0} conversations)`);
      if (testConv && testConv.length > 0) {
        console.log(`   Sample: ${testConv[0].id} - ${testConv[0].subject || 'No subject'}`);
        
        // Get messages for this conversation
        const { data: convMessages, error: msgErr } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', testConv[0].id)
          .limit(5);
        
        if (!msgErr) {
          console.log(`   Messages in conversation: ${convMessages?.length || 0}`);
        }
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Database check complete!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testConversationsTables();
