# Email-Based Account Approval Workflow

## Overview
Complete admin approval system implemented for ProtoLab 3D Poland user registration.

## ✅ Implementation Complete

### 1. **Database Schema Updates**
- **File**: `SQL/add-approval-workflow.sql`
- **New Fields Added to Users Table**:
  - `status` - VARCHAR with values: `pending`, `approved`, `rejected` (default: `pending`)
  - `approval_token` - TEXT - Unique token for admin approval links
  - `approved_at` - TIMESTAMP - When account was approved
  - `approved_by` - TEXT - Admin identifier who approved

**Action Required**: Run the SQL migration in Supabase:
```sql
-- Navigate to: https://supabase.com/dashboard/project/uxzhylisyovbdpdnguti/sql
-- Then execute: SQL/add-approval-workflow.sql
```

### 2. **User Registration Flow**

#### **When User Submits Registration**:
1. User fills out registration form
2. Account is created with `status: 'pending'`
3. Approval token is generated
4. **Two emails are sent automatically**:
   - ✅ **Submission Confirmation** → User receives: "Your registration request has been submitted successfully..."
   - ✅ **Admin Notification** → Admin (protolablogin@proton.me) receives registration details with Approve/Reject buttons

#### **User Response**:
```json
{
  "message": "Your registration request has been submitted successfully. You will receive an email confirmation once your account is approved by our admin team.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending"
  }
}
```

### 3. **Admin Notification Email**

**Sent To**: `protolablogin@proton.me`

**Contains**:
- User's full registration details:
  - Name, Email, Phone
  - Address, City, Zip Code, Country
  - Registration timestamp
- **Approve Button** → Links to: `http://localhost:5000/api/auth/approve-user?token=<approval_token>`
- **Reject Button** → Links to: `http://localhost:5000/api/auth/reject-user?token=<approval_token>`

### 4. **Admin Approval Process**

#### **Approve User**:
- **Endpoint**: `GET /api/auth/approve-user?token=<approval_token>`
- **Action**:
  1. Updates user status to `approved`
  2. Sets `approved_at` timestamp
  3. Clears approval token
  4. Sends approval email to user
- **Response**: HTML page confirming approval

#### **Reject User**:
- **Endpoint**: `GET /api/auth/reject-user?token=<approval_token>`
- **Action**:
  1. Updates user status to `rejected`
  2. Clears approval token
  3. Sends rejection email to user (optional reason)
- **Response**: HTML page confirming rejection

### 5. **User Notification Emails**

#### **Approval Email** (when admin approves):
- **Subject**: "✅ Account Approved - Welcome to ProtoLab 3D Poland!"
- **Content**:
  - Congratulations message
  - "Login to Dashboard" button
  - Getting started guide
  - Contact information

#### **Rejection Email** (when admin rejects):
- **Subject**: "Registration Status - ProtoLab 3D Poland"
- **Content**:
  - Polite rejection message
  - Optional reason for rejection
  - Contact information for appeals

### 6. **Login Restrictions**

#### **Status Checks**:
```typescript
// PENDING
if (user.status === 'pending') {
  throw new Error('Your account is pending approval. Please wait for admin confirmation. You will receive an email once approved.');
}

// REJECTED
if (user.status === 'rejected') {
  throw new Error('Your account registration was not approved. Please contact support for more information.');
}

// APPROVED
if (user.status === 'approved') {
  // Allow login and generate tokens
}
```

## API Endpoints

### Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+48123456789",
  "address": "123 Main St",
  "city": "Warsaw",
  "zipCode": "00-001",
  "country": "Poland"
}

Response:
{
  "message": "Your registration request has been submitted successfully. You will receive an email confirmation once your account is approved by our admin team.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending"
  }
}
```

### Admin Approval
```http
GET /api/auth/approve-user?token=<approval_token>

Response: HTML confirmation page
```

### Admin Rejection
```http
GET /api/auth/reject-user?token=<approval_token>

Response: HTML confirmation page
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (if approved):
{
  "message": "Login successful",
  "user": { ... },
  "tokens": { ... }
}

Response (if pending):
{
  "error": "Your account is pending approval. Please wait for admin confirmation. You will receive an email once approved."
}

Response (if rejected):
{
  "error": "Your account registration was not approved. Please contact support for more information."
}
```

## Email Templates

### 1. Submission Confirmation (to User)
- 📧 Professional design with gradient header
- ⏳ Clear "pending review" message
- 📋 Registration details summary
- ⌚ Expected timeline (24-48 hours)

### 2. Admin Notification (to protolablogin@proton.me)
- 🔔 Attention-grabbing header
- 📊 Complete user details in formatted table
- ✅ Green "Approve" button
- ❌ Red "Reject" button
- ℹ️ Action disclaimer

### 3. Approval Email (to User)
- 🎉 Celebration theme
- ✅ Approval confirmation
- 🔗 "Login to Dashboard" button
- 📝 Getting started checklist
- 📞 Support contact

### 4. Rejection Email (to User)
- 📝 Professional and respectful tone
- ℹ️ Optional rejection reason
- 📧 Contact information for appeals
- 🤝 Understanding message

## Configuration

### Environment Variables
```env
# Email Configuration
EMAIL_USER=protolablogin@proton.me
EMAIL_PASSWORD=iMperea&41@518
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:5000

# CORS
CORS_ORIGIN=http://localhost:8081
```

## Testing Workflow

### Test Complete Flow:
1. **Register New User**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "Test123!",
       "phone": "+48123456789"
     }'
   ```

2. **Check Admin Email**:
   - Login to `protolablogin@proton.me`
   - Find registration notification
   - Click "Approve" or "Reject"

3. **Check User Email**:
   - User receives approval/rejection email
   - Click "Login to Dashboard" (if approved)

4. **Test Login**:
   ```bash
   # Before approval (should fail)
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!"
     }'
   
   # After approval (should succeed)
   # Same request should return tokens
   ```

## Files Modified

### Backend:
- ✅ `src/models/User.ts` - Added approval fields to interface
- ✅ `src/services/email.service.ts` - Added 4 new email methods
- ✅ `src/services/auth.service.ts` - Updated registration and login logic
- ✅ `src/controllers/auth.controller.ts` - Added approval/rejection endpoints
- ✅ `src/routes/auth.routes.ts` - Added approval routes
- ✅ `.env` - Added BACKEND_URL

### Database:
- ✅ `SQL/add-approval-workflow.sql` - Migration script

### Documentation:
- ✅ `docs/APPROVAL_WORKFLOW.md` - This file

## Current Status

✅ **Backend Implementation**: Complete  
✅ **Email Templates**: Complete  
✅ **API Endpoints**: Complete  
✅ **Login Restrictions**: Complete  
⏳ **Database Migration**: Needs to be run in Supabase  
✅ **Environment Configuration**: Complete  

## Next Steps

1. **Run SQL Migration**:
   ```sql
   -- Execute SQL/add-approval-workflow.sql in Supabase SQL Editor
   ```

2. **Test the Complete Flow**:
   - Register a test user
   - Check admin email (protolablogin@proton.me)
   - Click approve/reject
   - Verify user email notification
   - Test login with different statuses

3. **Production Deployment** (when ready):
   - Update `FRONTEND_URL` and `BACKEND_URL` to production URLs
   - Ensure ProtonMail SMTP is working in production
   - Test email delivery

## Support

For issues or questions:
- **Email**: protolablogin@proton.me
- **Admin Dashboard**: Check Supabase for user statuses

---

**Implementation Date**: November 22, 2025  
**Version**: 1.0  
**Status**: ✅ Complete - Ready for Testing
