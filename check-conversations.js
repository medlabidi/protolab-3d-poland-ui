/**
 * Check conversations and messages in database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please check VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConversations() {
  console.log('\n========================================');
  console.log('🔍 CHECKING CONVERSATIONS');
  console.log('========================================\n');

  // Check if conversations table exists
  const { data: tables, error: tablesError } = await supabase
    .from('conversations')
    .select('*')
    .limit(1);

  if (tablesError) {
    console.error('❌ Error accessing conversations table:', tablesError.message);
    return;
  }

  console.log('✅ conversations table exists\n');

  // Get all conversations
  const { data: conversations, error: convsError } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });

  if (convsError) {
    console.error('❌ Error fetching conversations:', convsError.message);
    return;
  }

  console.log(`📊 Total conversations: ${conversations?.length || 0}`);

  if (conversations && conversations.length > 0) {
    console.log('\n--- Conversations ---');
    
    // Count by type
    const orderConvs = conversations.filter(c => c.order_id);
    const designConvs = conversations.filter(c => c.design_request_id);
    
    console.log(`  Print Job conversations: ${orderConvs.length}`);
    console.log(`  Design Request conversations: ${designConvs.length}`);
    
    console.log('\n--- Design Request Conversations ---');
    for (const conv of designConvs) {
      console.log(`\n  ID: ${conv.id}`);
      console.log(`  User ID: ${conv.user_id}`);
      console.log(`  Design Request ID: ${conv.design_request_id}`);
      console.log(`  Status: ${conv.status}`);
      console.log(`  Created: ${conv.created_at}`);
      
      // Get messages for this conversation
      const { data: messages, error: msgsError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      
      if (msgsError) {
        console.error(`    ❌ Error fetching messages: ${msgsError.message}`);
      } else {
        console.log(`  Messages: ${messages?.length || 0}`);
        if (messages && messages.length > 0) {
          for (const msg of messages) {
            const preview = msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : '');
            console.log(`    [${msg.sender_type}] ${preview}`);
            if (msg.attachments && msg.attachments.length > 0) {
              console.log(`      📎 ${msg.attachments.length} attachment(s)`);
            }
          }
        }
      }
    }
  }

  // Check conversation_messages table
  console.log('\n\n========================================');
  console.log('💬 CHECKING CONVERSATION MESSAGES');
  console.log('========================================\n');

  const { data: allMessages, error: allMsgsError } = await supabase
    .from('conversation_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (allMsgsError) {
    console.error('❌ Error fetching messages:', allMsgsError.message);
    return;
  }

  console.log(`📊 Total messages: ${allMessages?.length || 0}`);

  if (allMessages && allMessages.length > 0) {
    const userMessages = allMessages.filter(m => m.sender_type === 'user');
    const engineerMessages = allMessages.filter(m => m.sender_type === 'engineer');
    const systemMessages = allMessages.filter(m => m.sender_type === 'system');

    console.log(`  User messages: ${userMessages.length}`);
    console.log(`  Engineer/Admin messages: ${engineerMessages.length}`);
    console.log(`  System messages: ${systemMessages.length}`);
  }

  // Check design_requests with request_chat = true
  console.log('\n\n========================================');
  console.log('🎨 DESIGN REQUESTS WITH CHAT ENABLED');
  console.log('========================================\n');

  const { data: designRequests, error: drError } = await supabase
    .from('design_requests')
    .select('id, project_name, request_chat, created_at, user_id')
    .eq('request_chat', true)
    .order('created_at', { ascending: false });

  if (drError) {
    console.error('❌ Error fetching design requests:', drError.message);
  } else {
    console.log(`📊 Design Requests with chat enabled: ${designRequests?.length || 0}`);
    
    if (designRequests && designRequests.length > 0) {
      for (const dr of designRequests) {
        console.log(`\n  Request ID: ${dr.id}`);
        console.log(`  Project: ${dr.project_name}`);
        console.log(`  User ID: ${dr.user_id}`);
        console.log(`  Created: ${dr.created_at}`);
        
        // Check if conversation exists
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('design_request_id', dr.id)
          .single();
        
        if (convError && convError.code !== 'PGRST116') {
          console.error(`    ❌ Error checking conversation: ${convError.message}`);
        } else if (conv) {
          console.log(`    ✅ Conversation exists: ${conv.id}`);
        } else {
          console.log(`    ⚠️  NO CONVERSATION FOUND`);
        }
      }
    }
  }

  console.log('\n========================================\n');
}

checkConversations()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
