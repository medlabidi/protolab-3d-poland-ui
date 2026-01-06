# Conversation Data - Verification Checklist

## Current Status

### ✅ Code Layer (100% Complete)
- ✅ Server API endpoints defined (6 endpoints for admin)
- ✅ Admin controller created with full functionality
- ✅ Admin UI page built (AdminConversations.tsx)
- ✅ Frontend routes added
- ✅ Sidebar navigation updated
- ✅ All error handling implemented

### ⚠️ Database Layer (NEEDS VERIFICATION)
- ❓ `conversations` table exists in Supabase
- ❓ `messages` table exists in Supabase
- ❓ Proper indexes on conversation_id, user_id
- ❓ Foreign keys configured

---

## How to Verify Conversation Data

### Option 1: Check Supabase Dashboard Directly

1. **Go to Supabase Console:**
   ```
   https://app.supabase.com
   ```

2. **Login to project:** ejauqqpatmqbxxhbmkzp

3. **Check Tables:**
   - Go to **SQL Editor** or **Tables**
   - Look for `conversations` table
   - Look for `messages` table

4. **If tables exist:**
   - ✅ Click on each table
   - ✅ View sample records
   - ✅ Check that data is present

5. **If tables DON'T exist:**
   - ❌ Need to create them first (see below)

### Option 2: Run Query to Check Tables

**In Supabase SQL Editor, run:**

```sql
-- Check if conversations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name='conversations';

-- Check if messages table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name='messages';

-- Count records in conversations
SELECT COUNT(*) as conversation_count FROM conversations;

-- Count records in messages
SELECT COUNT(*) as message_count FROM messages;
```

### Option 3: Test via API

**Run the test script:**
```bash
# On Windows PowerShell
.\test-conversation-data.ps1
```

**If you get errors:**
- 404: Endpoint not found (code issue)
- 500: Server error (check logs)
- Empty array: Tables exist but no data

---

## If Tables Don't Exist - Create Them

### Create Conversations Table

**Run in Supabase SQL Editor:**

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX conversations_user_id ON conversations(user_id);
CREATE INDEX conversations_order_id ON conversations(order_id);
CREATE INDEX conversations_status ON conversations(status);
CREATE INDEX conversations_updated_at ON conversations(updated_at DESC);
```

### Create Messages Table

**Run in Supabase SQL Editor:**

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('user', 'engineer', 'system')) NOT NULL,
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX messages_conversation_id ON messages(conversation_id);
CREATE INDEX messages_sender_id ON messages(sender_id);
CREATE INDEX messages_created_at ON messages(created_at DESC);
CREATE INDEX messages_is_read ON messages(is_read);
```

### Enable RLS (Row Level Security)

```sql
-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can see their own conversations
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (user_id = auth.uid());

-- Admins can see all conversations
CREATE POLICY "Admins can view all conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view their conversation messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

---

## Verification Checklist

After creating tables (or verifying they exist), check:

- [ ] `conversations` table exists in Supabase
- [ ] `messages` table exists in Supabase
- [ ] Both tables have proper indexes
- [ ] Foreign keys are configured
- [ ] RLS policies are enabled (if using)
- [ ] At least one conversation record exists
- [ ] At least one message record exists

### After Verification:

- [ ] Test user endpoints: `GET /api/conversations`
- [ ] Test admin endpoints: `GET /api/admin/conversations`
- [ ] Verify data returns JSON (not errors)
- [ ] Check admin UI loads conversations
- [ ] Send test messages and verify they appear
- [ ] Test status updates

---

## Sample Test Data

If you want to test, you can insert sample data:

```sql
-- Insert test conversation
INSERT INTO conversations (order_id, user_id, subject, status)
SELECT 
  orders.id,
  orders.user_id,
  'Test conversation for order ' || orders.order_number,
  'open'
FROM orders
LIMIT 1;

-- Insert test message
INSERT INTO messages (conversation_id, sender_type, sender_id, message)
SELECT 
  conversations.id,
  'user',
  conversations.user_id,
  'Hello, when will my order be ready?'
FROM conversations
LIMIT 1;
```

---

## Common Issues & Solutions

### Issue: "Conversation not found"
**Solution:**
- Check conversation table exists
- Verify conversation_id is correct
- Confirm user_id matches (for user queries)

### Issue: "No conversations appearing"
**Solution:**
- Check if conversations table has records
- Verify orders and users tables have data
- Check foreign key constraints

### Issue: "Messages not showing"
**Solution:**
- Verify messages table exists
- Check that messages are linked to correct conversation_id
- Confirm is_read status is working

### Issue: "Admin can't see conversations"
**Solution:**
- Verify user has role = 'admin'
- Check RLS policies allow admin access
- Verify JWT token is valid

---

## Data Flow Verification

### For User-Side Conversations:

1. User logs in
2. Calls `GET /api/conversations`
3. Server queries conversations where user_id = current_user
4. Returns list with user's conversations
5. User can send messages
6. Messages stored in messages table

**Test:** Visit `/conversations` in app → Should see list of conversations

### For Admin-Side Conversations:

1. Admin logs in
2. Goes to `/admin/conversations`
3. Page calls `GET /api/admin/conversations`
4. Server queries ALL conversations (no user_id filter)
5. Returns paginated list
6. Admin can search, filter, reply
7. Replies stored with sender_type = 'engineer'

**Test:** Visit `/admin/conversations` → Should see all customer conversations

---

## Next Steps

1. **Verify Tables Exist**
   - Use Supabase dashboard
   - Or run SQL check queries

2. **If Missing - Create Tables**
   - Run SQL commands provided above
   - Enable RLS policies
   - Create indexes

3. **Verify Data Exists**
   - Check sample records in tables
   - Or insert test data

4. **Test API Endpoints**
   - Run test script
   - Check response status codes
   - Verify JSON data returns

5. **Test UI**
   - Access `/conversations` (user)
   - Access `/admin/conversations` (admin)
   - Send messages and verify

---

## Current Implementation Details

### API Response Format

**User Conversations List:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "user_id": "uuid",
      "subject": "string",
      "status": "open|in_progress|resolved|closed",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp",
      "order": { /* order details */ },
      "user": { /* user details */ },
      "unread_count": 0,
      "last_message": { /* message object */ }
    }
  ]
}
```

**Admin Conversations List:**
```json
{
  "success": true,
  "conversations": [ /* same format as above */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## Support

If you have issues:

1. Check Supabase dashboard for table structure
2. Review server logs: `npm run dev` output
3. Use browser DevTools to check API responses
4. Run test script to diagnose issues
5. Check CONVERSATION_DATA_GUIDE.md for endpoint details

---

**Status:** Ready for Data Verification ✅  
**Last Updated:** January 6, 2026

