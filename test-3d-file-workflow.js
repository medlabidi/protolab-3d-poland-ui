/**
 * Test 3D File Workflow - Admin to User
 * This script tests the complete flow of admin sending a 3D file with price to a user
 * 
 * Flow:
 * 1. Check if test user exists (mahmoud@protolab.info as admin, test user as customer)
 * 2. Create a design request from user
 * 3. Admin sends 3D file with price
 * 4. User views the file in dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

async function findOrCreateTestUser() {
  console.log(`\n${colors.cyan}${colors.bright}🔍 Step 1: Finding Test User${colors.reset}`);
  
  // Try to find an existing regular user (not admin)
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'user')
    .limit(5);
  
  if (error) {
    console.log(`${colors.red}❌ Error fetching users: ${error.message}${colors.reset}`);
    return null;
  }
  
  console.log(`\n${colors.yellow}Found ${users?.length || 0} regular user(s):${colors.reset}`);
  
  if (users && users.length > 0) {
    users.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${colors.bright}${user.email}${colors.reset} (ID: ${user.id})`);
    });
    
    // Use the first user
    const testUser = users[0];
    console.log(`\n${colors.green}✅ Using test user: ${testUser.email}${colors.reset}`);
    return testUser;
  } else {
    console.log(`${colors.yellow}⚠️  No regular users found. Please create a user account first.${colors.reset}`);
    return null;
  }
}

async function findAdminUser() {
  console.log(`\n${colors.cyan}${colors.bright}👨‍💼 Finding Admin User${colors.reset}`);
  
  const { data: admin, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'mahmoud@protolab.info')
    .single();
  
  if (error) {
    console.log(`${colors.red}❌ Admin not found: ${error.message}${colors.reset}`);
    return null;
  }
  
  console.log(`${colors.green}✅ Admin found: ${admin.email} (${admin.role})${colors.reset}`);
  return admin;
}

async function findOrCreateDesignRequest(userId) {
  console.log(`\n${colors.cyan}${colors.bright}📝 Step 2: Finding/Creating Design Request${colors.reset}`);
  
  // Check for existing design requests
  const { data: existing, error: fetchError } = await supabase
    .from('design_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (existing && existing.length > 0) {
    console.log(`\n${colors.yellow}Found ${existing.length} existing design request(s):${colors.reset}`);
    existing.forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${colors.bright}${req.project_name}${colors.reset} - Status: ${req.design_status}`);
      console.log(`     Created: ${new Date(req.created_at).toLocaleString()}`);
    });
    
    // Use the most recent one
    const designRequest = existing[0];
    console.log(`\n${colors.green}✅ Using design request: ${designRequest.project_name} (ID: ${designRequest.id})${colors.reset}`);
    return designRequest;
  }
  
  // Create a new design request
  console.log(`${colors.yellow}No existing requests found. Creating new design request...${colors.reset}`);
  
  const { data: newRequest, error: createError } = await supabase
    .from('design_requests')
    .insert({
      user_id: userId,
      project_name: 'Test 3D Model - Cube',
      idea_description: 'Simple test cube for 3D file upload testing',
      usage_type: 'functional',
      usage_details: 'Testing prototype',
      approximate_dimensions: '50x50x50mm',
      desired_material: 'PLA',
      design_status: 'in_progress'
    })
    .select()
    .single();
  
  if (createError) {
    console.log(`${colors.red}❌ Failed to create design request: ${createError.message}${colors.reset}`);
    return null;
  }
  
  console.log(`${colors.green}✅ Created new design request: ${newRequest.project_name}${colors.reset}`);
  return newRequest;
}

async function checkConversation(designRequestId) {
  console.log(`\n${colors.cyan}${colors.bright}💬 Step 3: Checking Conversation${colors.reset}`);
  
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('design_request_id', designRequestId)
    .maybeSingle();
  
  if (conversation) {
    console.log(`${colors.green}✅ Conversation exists (ID: ${conversation.id})${colors.reset}`);
    
    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    
    console.log(`   Messages: ${messages?.length || 0}`);
    
    if (messages && messages.length > 0) {
      console.log(`\n${colors.yellow}Recent messages:${colors.reset}`);
      messages.slice(-3).forEach((msg, idx) => {
        const sender = msg.sender_type === 'engineer' ? '👨‍💼 Admin' : '👤 User';
        const hasAttachments = msg.attachments && msg.attachments.length > 0;
        const attachmentInfo = hasAttachments ? ` ${colors.cyan}[📎 ${msg.attachments.length} file(s)]${colors.reset}` : '';
        
        console.log(`  ${sender}: ${msg.message.substring(0, 60)}...${attachmentInfo}`);
        
        if (hasAttachments) {
          msg.attachments.forEach(att => {
            const is3D = /\.(stl|obj|3mf|glb|gltf)$/i.test(att.name);
            const icon = is3D ? '🎨' : '📄';
            const sizeKB = (att.size / 1024).toFixed(2);
            console.log(`     ${icon} ${att.name} (${sizeKB} KB) - ${att.url}`);
          });
        }
      });
    }
    
    return conversation;
  } else {
    console.log(`${colors.yellow}⚠️  No conversation exists yet${colors.reset}`);
    console.log(`   This will be created when admin sends first message`);
    return null;
  }
}

async function displayTestInstructions(user, designRequest, admin) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}📋 MANUAL TESTING INSTRUCTIONS${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  
  console.log(`\n${colors.yellow}${colors.bright}PART 1: ADMIN DASHBOARD (Send 3D File + Price)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`1. Open browser: ${colors.bright}http://localhost:8080/admin/login${colors.reset}`);
  console.log(`2. Login as Admin:`);
  console.log(`   Email:    ${colors.bright}${admin.email}${colors.reset}`);
  console.log(`   Password: ${colors.bright}your_admin_password${colors.reset}`);
  console.log(`\n3. Navigate to: ${colors.bright}Design Assistance${colors.reset} (in sidebar)`);
  console.log(`\n4. Find design request: ${colors.bright}"${designRequest.project_name}"${colors.reset}`);
  console.log(`   ${colors.yellow}(Click the Eye 👁️ icon to open conversation)${colors.reset}`);
  console.log(`\n5. In the conversation panel:`);
  console.log(`   a. Click the ${colors.bright}Upload button (📎)${colors.reset}`);
  console.log(`   b. Select a valid .stl file from your computer`);
  console.log(`      ${colors.yellow}Recommended: Use a small test file (<5MB)${colors.reset}`);
  console.log(`   c. Enter proposed price: ${colors.bright}150.00${colors.reset} PLN`);
  console.log(`   d. Type message: ${colors.bright}"Here is your custom 3D design"${colors.reset}`);
  console.log(`   e. Click ${colors.bright}Send${colors.reset} button`);
  console.log(`\n6. ${colors.green}Open browser console (F12)${colors.reset} and verify:`);
  console.log(`   ${colors.green}✓${colors.reset} [Admin] Sending message with file:`);
  console.log(`   ${colors.green}✓${colors.reset} [Admin] Response status: 200 OK`);
  console.log(`   ${colors.green}✓${colors.reset} [Admin] ✅ File uploaded successfully`);
  
  console.log(`\n${colors.yellow}${colors.bright}PART 2: USER DASHBOARD (View 3D File)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`1. Logout from admin`);
  console.log(`\n2. Login as User:`);
  console.log(`   Email:    ${colors.bright}${user.email}${colors.reset}`);
  console.log(`   Password: ${colors.bright}user_password${colors.reset}`);
  console.log(`\n3. Navigate to: ${colors.bright}Design Assistance${colors.reset}`);
  console.log(`\n4. Find your design request: ${colors.bright}"${designRequest.project_name}"${colors.reset}`);
  console.log(`   Click ${colors.bright}View Conversation${colors.reset}`);
  console.log(`\n5. You should see:`);
  console.log(`   ${colors.green}✓${colors.reset} Admin message: "Here is your custom 3D design"`);
  console.log(`   ${colors.green}✓${colors.reset} Price: "💰 Proposed Price: 150.00 PLN"`);
  console.log(`   ${colors.green}✓${colors.reset} 3D file attachment card`);
  console.log(`\n6. Click: ${colors.bright}Open 3D Viewer (Fullscreen)${colors.reset}`);
  console.log(`\n7. ${colors.green}Verify in fullscreen viewer:${colors.reset}`);
  console.log(`   ${colors.green}✓${colors.reset} Loading spinner appears`);
  console.log(`   ${colors.green}✓${colors.reset} 3D model loads and displays`);
  console.log(`   ${colors.green}✓${colors.reset} Badge shows: "📁 Loaded from local server" or "☁️ Loaded from AWS S3"`);
  console.log(`   ${colors.green}✓${colors.reset} Can rotate model with mouse`);
  console.log(`   ${colors.green}✓${colors.reset} Can zoom with scroll wheel`);
  console.log(`   ${colors.green}✓${colors.reset} ${colors.bright}NO download button${colors.reset} (view-only)`);
  console.log(`   ${colors.green}✓${colors.reset} "Approve Design & Proceed to Payment" button visible`);
  console.log(`   ${colors.green}✓${colors.reset} "Reject Design" button visible`);
  
  console.log(`\n${colors.yellow}${colors.bright}VERIFICATION CHECKLIST${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}Open browser console (F12) on user dashboard and check:${colors.reset}`);
  console.log(`  ${colors.green}✓${colors.reset} [S3FileViewer] Opening fullscreen, resolving URL...`);
  console.log(`  ${colors.green}✓${colors.reset} [S3FileViewer] Resolved file URL: {...}`);
  console.log(`  ${colors.green}✓${colors.reset} [ModelViewer] Loading model: {...}`);
  console.log(`  ${colors.green}✓${colors.reset} [STL Loader] Response status: 200 OK`);
  console.log(`  ${colors.green}✓${colors.reset} [STL Loader] Successfully parsed STL file`);
  
  console.log(`\n${colors.red}${colors.bright}TROUBLESHOOTING${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}If file upload fails:${colors.reset}`);
  console.log(`  1. Check server terminal for errors`);
  console.log(`  2. Run: ${colors.bright}.\\test-file-upload.ps1${colors.reset}`);
  console.log(`  3. Verify file is valid STL/OBJ (not HTML error page)`);
  console.log(`  4. Try a smaller file (<5MB)`);
  console.log(`\n${colors.yellow}If 3D viewer shows error:${colors.reset}`);
  console.log(`  1. Check browser console for detailed error`);
  console.log(`  2. Verify file URL is accessible: ${colors.bright}http://localhost:5001/uploads/...${colors.reset}`);
  console.log(`  3. Check file exists: ${colors.bright}server/uploads/${colors.reset}`);
  console.log(`  4. Clear browser cache and reload`);
  
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✅ Ready to test! Follow the instructions above.${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log(`╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║     3D FILE WORKFLOW TEST - ADMIN TO USER                      ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝`);
  console.log(colors.reset);
  
  try {
    // Find admin
    const admin = await findAdminUser();
    if (!admin) {
      console.log(`\n${colors.red}❌ Cannot proceed without admin user${colors.reset}`);
      process.exit(1);
    }
    
    // Find or create test user
    const user = await findOrCreateTestUser();
    if (!user) {
      console.log(`\n${colors.red}❌ Cannot proceed without test user${colors.reset}`);
      console.log(`${colors.yellow}Please create a regular user account first:${colors.reset}`);
      console.log(`  1. Go to http://localhost:8080/signup`);
      console.log(`  2. Create an account`);
      console.log(`  3. Run this script again`);
      process.exit(1);
    }
    
    // Find or create design request
    const designRequest = await findOrCreateDesignRequest(user.id);
    if (!designRequest) {
      console.log(`\n${colors.red}❌ Failed to create design request${colors.reset}`);
      process.exit(1);
    }
    
    // Check conversation
    await checkConversation(designRequest.id);
    
    // Display instructions
    await displayTestInstructions(user, designRequest, admin);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

main();
