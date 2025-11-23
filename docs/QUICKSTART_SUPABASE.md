# ProtoLab 3D Poland - Quick Start with Supabase

## ✅ Migration Complete

MongoDB has been fully replaced with Supabase!

## 🚀 Quick Setup (5 minutes)

### 1. Run Database Migration

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire content from `supabase-schema.sql`
4. Click **Run** to create all tables

### 2. Create Storage Buckets

In Supabase Dashboard → **Storage**:

1. Create bucket: `temp-files` (Private)
2. Create bucket: `print-jobs` (Private)

### 3. Update Environment Variables

Your `.env` file is already configured with:
```
SUPABASE_URL=https://uxzhylisyovbpdnguti.supabase.co
VITE_SUPABASE_URL=https://uxzhylisyovbpdnguti.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important**: Add your `SUPABASE_SERVICE_ROLE_KEY`:
- Go to Project Settings → API
- Copy the `service_role` key (secret!)
- Update `.env`:
  ```
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Verify Connection

```bash
npm run verify-db
```

Expected output:
```
✅ Supabase Connection Successful!
📊 Checking Tables:
  ✅ users: 0 records
  ✅ orders: 0 records
  ✅ refresh_tokens: 0 records
  ✅ settings: 1 records
```

### 6. Start Development

```bash
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:8080

## 📋 What Changed

### Database Layer
- ❌ MongoDB/Mongoose → ✅ Supabase/PostgreSQL
- All models converted to TypeScript interfaces
- Query methods updated for Supabase

### Environment Variables
- ❌ `MONGO_URI` → ✅ `SUPABASE_URL`
- ❌ `MONGODB_URI` → ✅ `SUPABASE_SERVICE_ROLE_KEY`
- New: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for frontend

### Field Names (snake_case)
- `userId` → `user_id`
- `createdAt` → `created_at`
- `passwordHash` → `password_hash`
- `materialWeight` → `material_weight`
- etc.

### IDs
- ❌ `_id` (MongoDB ObjectId) → ✅ `id` (UUID)

## 🧪 Testing the API

### Register User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Create Order (requires auth token)
```bash
POST http://localhost:5000/api/orders
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data

file: [STL_FILE]
material: "PLA"
color: "black"
layerHeight: 0.2
infill: 20
quantity: 1
shippingMethod: "pickup"
```

## 📂 File Structure

```
src/
├── config/
│   ├── database.ts         # Supabase client initialization
│   └── logger.ts
├── models/
│   ├── User.ts            # User model with Supabase queries
│   ├── Order.ts           # Order model with Supabase queries
│   ├── RefreshToken.ts    # Token model with Supabase queries
│   └── Settings.ts        # Settings model with Supabase queries
├── services/
│   ├── auth.service.ts    # Authentication logic
│   ├── user.service.ts    # User management
│   ├── order.service.ts   # Order management
│   └── settings.service.ts
├── controllers/           # Express route handlers
├── middleware/           # Auth, validation, etc.
└── types/               # TypeScript interfaces

client/src/
└── config/
    └── supabase.ts       # Frontend Supabase client (Vite)
```

## 🔧 Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Get it from Supabase Dashboard → Project Settings → API
- It's different from the anon key!
- Add it to `.env` file

### "Table does not exist"
- Run the SQL migration in Supabase SQL Editor
- Check Table Editor to verify tables were created

### "Storage bucket not found"
- Create buckets in Supabase Dashboard → Storage
- Ensure names match: `temp-files` and `print-jobs`

### Connection Verification Fails
```bash
npm run verify-db
```
Check the output for specific error messages.

## 📚 Documentation

- **Full Migration Guide**: `docs/SUPABASE_MIGRATION.md`
- **Database Schema**: `supabase-schema.sql`
- **Environment Setup**: `.env.example`

## 🎉 You're Ready!

The application is now running on Supabase with:
- ✅ PostgreSQL database with all tables
- ✅ Row Level Security policies
- ✅ Storage buckets for file uploads
- ✅ All models and services updated
- ✅ JWT authentication working
- ✅ Full API compatibility maintained

Happy coding! 🚀
