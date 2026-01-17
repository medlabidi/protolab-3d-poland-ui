/**
 * Check messages for a specific design request conversation
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDesignMessages() {
  console.log('\n========================================');
  console.log('📋 CHECKING DESIGN REQUEST MESSAGES');
  console.log('========================================\n');

  // Get all design requests
  const { data: designRequests, error: drError } = await supabase
    .from('design_requests')
    .select('id, project_name, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (drError) {
    console.error('❌ Error fetching design requests:', drError.message);
    return;
  }

  console.log(`Found ${designRequests?.length || 0} recent design requests\n`);

  for (const dr of designRequests || []) {
    console.log(`\n📦 Design Request: ${dr.project_name}`);
    console.log(`   ID: ${dr.id}`);
    console.log(`   User: ${dr.user_id}`);

    // Check for conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, status, created_at')
      .eq('design_request_id', dr.id)
      .maybeSingle();

    if (convError && convError.code !== 'PGRST116') {
      console.error(`   ❌ Error fetching conversation: ${convError.message}`);
      continue;
    }

    if (!conv) {
      console.log(`   ⚠️  No conversation found`);
      continue;
    }

    console.log(`   ✅ Conversation: ${conv.id}`);
    console.log(`   Status: ${conv.status}`);

    // Get messages
    const { data: messages, error: msgsError } = await supabase
      .from('conversation_messages')
      .select('id, sender_type, message, created_at, is_read')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgsError) {
      console.error(`   ❌ Error fetching messages: ${msgsError.message}`);
      continue;
    }

    console.log(`   💬 Messages: ${messages?.length || 0}`);
    
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const time = new Date(msg.created_at).toLocaleString();
        const preview = msg.message.substring(0, 60) + (msg.message.length > 60 ? '...' : '');
        const readStatus = msg.is_read ? '✓' : '○';
        console.log(`      ${readStatus} [${msg.sender_type}] ${time}`);
        console.log(`         "${preview}"`);
      }
    }
  }

  console.log('\n========================================\n');
}

checkDesignMessages()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
