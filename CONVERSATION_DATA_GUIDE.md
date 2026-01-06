# Conversation Data Structure & API Testing

## Overview
✅ Conversation system fully integrated with Supabase PostgreSQL database
✅ Both user-side and admin-side endpoints operational
✅ Real-time message tracking with read status

---

## 1. Database Schema

### Conversations Table
```sql
conversations (
  id UUID PRIMARY KEY,
  order_id UUID FOREIGN KEY → orders.id,
  user_id UUID FOREIGN KEY → users.id,
  subject TEXT NULLABLE,
  status ENUM ('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Messages Table
```sql
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID FOREIGN KEY → conversations.id,
  sender_type ENUM ('user', 'engineer', 'system'),
  sender_id UUID FOREIGN KEY → users.id NULLABLE,
  message TEXT,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)
```

---

## 2. Conversation Data Structure

### Single Conversation Object
```json
{
  "id": "uuid-here",
  "order_id": "uuid-here",
  "user_id": "uuid-here",
  "subject": "Order #12345 Discussion",
  "status": "open",
  "created_at": "2026-01-06T10:00:00.000Z",
  "updated_at": "2026-01-06T12:30:00.000Z",
  "order": {
    "id": "uuid-here",
    "file_name": "bracket_v2.stl",
    "project_name": "Mechanical Parts",
    "status": "printing"
  },
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  },
  "unread_count": 2,
  "last_message": {
    "id": "uuid-here",
    "conversation_id": "uuid-here",
    "sender_type": "user",
    "sender_id": "uuid-here",
    "message": "When will the order be ready?",
    "attachments": [],
    "is_read": false,
    "created_at": "2026-01-06T12:30:00.000Z"
  }
}
```

### Message Object
```json
{
  "id": "uuid-here",
  "conversation_id": "uuid-here",
  "sender_type": "user",
  "sender_id": "uuid-here",
  "message": "When will the order be ready?",
  "attachments": [],
  "is_read": false,
  "created_at": "2026-01-06T12:30:00.000Z",
  "sender": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

---

## 3. API Endpoints Reference

### User-Side Conversations Endpoints

#### 1. Get All Conversations (User)
```http
GET /api/conversations
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "conversations": [
    { /* conversation object */ }
  ]
}
```

#### 2. Get Unread Count
```http
GET /api/conversations/unread
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "unread_count": 2
}
```

#### 3. Get or Create Conversation for Order
```http
POST /api/conversations/order/{orderId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "subject": "Order Discussion"
}
```

**Response:**
```json
{
  "conversation": { /* conversation object */ }
}
```

#### 4. Get Specific Conversation
```http
GET /api/conversations/{conversationId}
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "conversation": { /* conversation object */ }
}
```

#### 5. Get Messages in Conversation
```http
GET /api/conversations/{conversationId}/messages?limit=50
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "messages": [
    { /* message objects */ }
  ]
}
```

#### 6. Send Message
```http
POST /api/conversations/{conversationId}/messages
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "message": "Hello, when will my order be ready?"
}
```

**Response:**
```json
{
  "message": { /* message object */ }
}
```

#### 7. Mark Conversation as Read
```http
POST /api/conversations/{conversationId}/read
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Marked as read"
}
```

---

### Admin-Side Conversations Endpoints (NEW!)

#### 1. Get All Conversations (Admin)
```http
GET /api/admin/conversations?page=1&limit=20&status=open&search=john
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `page` - Pagination (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (open, in_progress, resolved, closed)
- `search` - Search by user name/email or subject

**Response:**
```json
{
  "success": true,
  "conversations": [
    { /* conversation objects */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### 2. Get Specific Conversation (Admin)
```http
GET /api/admin/conversations/{conversationId}
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "conversation": { /* conversation object */ }
}
```

#### 3. Get Messages (Admin)
```http
GET /api/admin/conversations/{conversationId}/messages?limit=50
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "messages": [
    { /* message objects */ }
  ]
}
```

#### 4. Send Admin Reply
```http
POST /api/admin/conversations/{conversationId}/messages
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "message": "Your order will be ready tomorrow!"
}
```

**Response:**
```json
{
  "success": true,
  "message": { /* message object with sender_type: 'engineer' */ }
}
```

#### 5. Update Conversation Status (Admin)
```http
PATCH /api/admin/conversations/{conversationId}/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "status": "resolved"
}
```

**Valid Statuses:**
- `open` - New or ongoing
- `in_progress` - Being handled
- `resolved` - Issue resolved
- `closed` - Conversation closed

**Response:**
```json
{
  "success": true,
  "conversation": { /* updated conversation object */ }
}
```

#### 6. Mark as Read (Admin)
```http
POST /api/admin/conversations/{conversationId}/read
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

---

## 4. How to Test Conversation Data

### Prerequisites
1. ✅ Server running on port 5000
2. ✅ User must be logged in (have accessToken)
3. ✅ At least one order exists for the user

### Test Flow

#### Step 1: User Sends Message
```bash
curl -X POST http://localhost:5000/api/conversations/order/{orderId}/messages \
  -H "Authorization: Bearer {userToken}" \
  -H "Content-Type: application/json" \
  -d '{"message":"When will this be ready?"}'
```

#### Step 2: Get All User Conversations
```bash
curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer {userToken}"
```

#### Step 3: Admin Views Conversations
```bash
curl http://localhost:5000/api/admin/conversations \
  -H "Authorization: Bearer {adminToken}"
```

#### Step 4: Admin Sends Reply
```bash
curl -X POST http://localhost:5000/api/admin/conversations/{conversationId}/messages \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"message":"Your order will be ready tomorrow!"}'
```

#### Step 5: Admin Updates Status
```bash
curl -X PATCH http://localhost:5000/api/admin/conversations/{conversationId}/status \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```

---

## 5. Message Flow Example

### Scenario: Customer Support Conversation

#### Timeline
1. **User sends message** (10:00 AM)
   - `sender_type: 'user'`
   - `message: "When will my order be ready?"`
   - `is_read: false`

2. **Admin receives notification**
   - Sees unread count in list
   - Views conversation in admin panel

3. **Admin replies** (10:15 AM)
   - `sender_type: 'engineer'`
   - `message: "Your order will be ready tomorrow!"`
   - `is_read: false` (initially)

4. **User sees reply**
   - Messages marked as read
   - `is_read: true` for admin message

5. **Admin closes conversation**
   - Status changed to `resolved` or `closed`
   - Conversation archived

---

## 6. Status Transitions

```
open
  ↓
in_progress ← (Admin actively helping)
  ↓
resolved ← (Issue fixed)
  ↓
closed ← (Final state)
```

---

## 7. Data Retrieval Examples

### Get All Conversations by Status
```bash
# Get only open conversations
curl "http://localhost:5000/api/admin/conversations?status=open" \
  -H "Authorization: Bearer {adminToken}"
```

### Search Conversations
```bash
# Search for conversations with "John"
curl "http://localhost:5000/api/admin/conversations?search=john" \
  -H "Authorization: Bearer {adminToken}"
```

### Pagination
```bash
# Get second page with 10 items per page
curl "http://localhost:5000/api/admin/conversations?page=2&limit=10" \
  -H "Authorization: Bearer {adminToken}"
```

---

## 8. Conversation Lifecycle

### Creation
- Auto-created when order is created
- Or manually created via `/conversations/order/{orderId}`

### Activity
- User sends messages
- Admin replies
- Status gets updated
- Messages marked as read

### Closure
- Admin changes status to `resolved` or `closed`
- No new messages can be sent (in UI)
- Conversation archived

---

## 9. Current Data Status

| Component | Status | Details |
|-----------|--------|---------|
| **User Conversations** | ✅ | Fully functional, 7 endpoints |
| **Admin Conversations** | ✅ | Newly added, 6 endpoints |
| **Database Tables** | ✅ | `conversations` & `messages` tables |
| **Message Tracking** | ✅ | Read/unread status working |
| **Auto-creation** | ✅ | Conversations created with orders |
| **Search & Filter** | ✅ | Admin can search & filter |
| **Status Management** | ✅ | 4 status types supported |

---

## 10. Troubleshooting

### No Conversations Appearing?
- Check if order exists for user
- Verify JWT token is valid
- Check `/api/conversations` endpoint returns empty array or has conversations

### Messages Not Showing?
- Verify conversation ID is correct
- Check messages were actually sent (check messages table in Supabase)
- Verify `is_read` status updating correctly

### Admin Can't See Conversations?
- Verify user has `role: 'admin'`
- Check `/api/admin/conversations` endpoint is accessible
- Verify JWT token has correct permissions

### Conversation Status Not Updating?
- Check request body has valid status
- Verify conversation ID exists
- Check server logs for error messages

---

## Quick Reference

### Most Used Endpoints

**User:**
- `GET /api/conversations` - List all conversations
- `POST /api/conversations/{id}/messages` - Send message
- `GET /api/conversations/{id}/messages` - View messages

**Admin:**
- `GET /api/admin/conversations` - List all conversations
- `POST /api/admin/conversations/{id}/messages` - Send reply
- `PATCH /api/admin/conversations/{id}/status` - Update status

---

**Last Updated:** January 6, 2026  
**Status:** All conversation endpoints verified and operational ✅

