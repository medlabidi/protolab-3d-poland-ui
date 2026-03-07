/**
 * Fix missing conversations for design requests
 * Creates conversations for design requests that should have them
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

async function fixMissingConversations() {
  console.log('\n========================================');
  console.log('🔧 FIXING MISSING CONVERSATIONS');
  console.log('========================================\n');

  // Find all design requests with request_chat = true
  const { data: designRequests, error: drError } = await supabase
    .from('design_requests')
    .select('id, project_name, user_id, request_chat, created_at')
    .eq('request_chat', true);

  if (drError) {
    console.error('❌ Error fetching design requests:', drError.message);
    return;
  }

  console.log(`📊 Found ${designRequests?.length || 0} design requests with chat enabled\n`);

  if (!designRequests || designRequests.length === 0) {
    console.log('✅ No design requests need fixing');
    return;
  }

  let fixed = 0;
  let alreadyHasConversation = 0;

  for (const dr of designRequests) {
    console.log(`\n🔍 Checking design request: ${dr.id}`);
    console.log(`   Project: ${dr.project_name}`);
    console.log(`   User: ${dr.user_id}`);

    // Check if conversation already exists
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('design_request_id', dr.id)
      .maybeSingle();

    if (convError && convError.code !== 'PGRST116') {
      console.error(`   ❌ Error checking conversation: ${convError.message}`);
      continue;
    }

    if (existingConv) {
      console.log(`   ✅ Conversation already exists: ${existingConv.id}`);
      alreadyHasConversation++;
      continue;
    }

    // Create conversation
    console.log(`   ⚙️  Creating conversation...`);
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        user_id: dr.user_id,
        design_request_id: dr.id,
        subject: 'Design Assistance Request',
        status: 'open',
        created_at: dr.created_at // Use the same creation date as the design request
      }])
      .select('id')
      .single();

    if (createError) {
      console.error(`   ❌ Error creating conversation: ${createError.message}`);
      continue;
    }

    console.log(`   ✅ Conversation created: ${newConv.id}`);
    fixed++;
  }

  console.log('\n========================================');
  console.log('📊 SUMMARY');
  console.log('========================================');
  console.log(`Total design requests with chat: ${designRequests.length}`);
  console.log(`Already had conversation: ${alreadyHasConversation}`);
  console.log(`Fixed (conversation created): ${fixed}`);
  console.log('========================================\n');
}

fixMissingConversations()
  .then(() => {
    console.log('✅ Fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
