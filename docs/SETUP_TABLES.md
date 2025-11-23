# 🚀 Final Setup Steps - Create Database Tables

## ✅ Connection Successful!

Your Supabase connection is working! Now you need to create the database tables.

## 📝 Step 1: Create Tables in Supabase

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `uxzhylisyovbdpdnguti`

2. **Open SQL Editor**
   - In the left sidebar, click on **"SQL Editor"**
   - Click **"New query"**

3. **Run the Migration**
   - Copy the entire content from `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter)

4. **Verify Success**
   - You should see a success message
   - Check the **"Table Editor"** in the sidebar
   - You should see 4 tables:
     - ✅ users
     - ✅ orders
     - ✅ refresh_tokens
     - ✅ settings

## 📦 Step 2: Storage Buckets (Already Done!)

I can see your storage buckets are already created:
- ✅ `temp_files`
- ✅ `print-jobs`

Perfect! No action needed here.

## 🧪 Step 3: Verify Everything Works

After creating the tables, run:

```bash
npm run init-db
```

This will:
- ✅ Create default settings (material_rate: 0.05, time_rate: 10, service_fee: 5)
- ✅ Verify all tables are accessible
- ✅ Show record counts

Expected output:
```
🔧 Initializing Supabase Database...
📝 Creating default settings...
✅ Default settings created:
   Material Rate: 0.05
   Time Rate: 10
   Service Fee: 5

📊 Database Status:
   ✅ users: 0 records
   ✅ orders: 0 records
   ✅ refresh_tokens: 0 records
   ✅ settings: 1 records

🎉 Database initialized successfully!
```

## 🎉 Step 4: Start Development

Once tables are created and initialized:

```bash
npm run dev
```

This starts both frontend and backend:
- Backend API: http://localhost:5000
- Frontend: http://localhost:8080

## 📋 Quick Reference

### Your Supabase Details
- **URL**: https://uxzhylisyovbdpdnguti.supabase.co
- **Project Ref**: uxzhylisyovbdpdnguti
- **Status**: ✅ Connected
- **Buckets**: ✅ Created (temp_files, print-jobs)
- **Tables**: ⚠️ Need to be created (run SQL migration)

### Available Commands
```bash
npm run verify-db    # Test Supabase connection
npm run init-db      # Initialize database with defaults
npm run dev          # Start development (frontend + backend)
npm run dev:server   # Start backend only
npm run dev:client   # Start frontend only
```

## 🐛 Troubleshooting

### If `init-db` fails with "table not found"
→ You haven't run the SQL migration yet. Go back to Step 1.

### If you see "RLS policy" errors
→ The service role key should bypass RLS. Make sure you're using the correct service role key.

### If connection fails
→ Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct in `.env`

---

**Next Step**: Copy the content from `supabase-schema.sql` and run it in Supabase SQL Editor!
