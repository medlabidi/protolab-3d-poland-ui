# 🚀 Migration Step-by-Step Guide

## ⚠️ IMPORTANT - Read First

This migration will:
1. ✅ Create two new tables: `print_jobs` and `design_requests`
2. ✅ Copy all existing data from `orders` table
3. ✅ Keep the old `orders` table as backup
4. ✅ Create indices for performance
5. ✅ Set up Row Level Security (RLS)

**Estimated time:** 2-3 minutes  
**Data loss:** None (old table is preserved)

---

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New query"**

---

## Step 2: Copy Migration SQL

**File to copy:** `SQL/separate-print-design-tables.sql`

Or copy from here:

```sql
-- ============================================
-- COPY THE ENTIRE CONTENT FROM:
-- SQL/separate-print-design-tables.sql
-- ============================================
```

---

## Step 3: Execute Migration

1. **Paste** the SQL into the editor
2. **Click "Run"** button (or press Ctrl+Enter)
3. **Wait** for completion (30-60 seconds)
4. **Check output** - you should see:

```
✓ Migration Complete!
✓ print_jobs table created
✓ design_requests table created
✓ Data migrated successfully
```

---

## Step 4: Verify Migration

Run this verification query:

```sql
-- Check both tables exist
SELECT 
    'print_jobs' as table_name,
    COUNT(*) as total_records
FROM print_jobs
UNION ALL
SELECT 
    'design_requests' as table_name,
    COUNT(*) as total_records
FROM design_requests
UNION ALL
SELECT 
    'orders (old)' as table_name,
    COUNT(*) as total_records
FROM orders;
```

**Expected result:**
```
table_name         | total_records
-------------------|---------------
print_jobs         | X (your print jobs)
design_requests    | Y (your design requests)
orders (old)       | X+Y (old table intact)
```

---

## Step 5: Check Indices

```sql
-- Verify indices were created
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('print_jobs', 'design_requests')
ORDER BY tablename, indexname;
```

**Expected:** 12 total indices (6 for each table)

---

## Step 6: Test the View

```sql
-- Test the unified view
SELECT 
    order_type,
    COUNT(*) as total
FROM all_orders
GROUP BY order_type;
```

**Expected result:**
```
order_type | total
-----------|-------
print      | X
design     | Y
```

---

## Step 7: Restart Backend Server

```bash
# Stop the server (Ctrl+C if running)
cd server
npm run dev
```

---

## Step 8: Test API Endpoints

### Test 1: Get All Orders
```bash
curl http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected:** Combined array of print jobs + design requests

### Test 2: Create Print Job
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "print",
    "fileName": "test.stl",
    "fileUrl": "https://example.com/test.stl",
    "material": "PLA",
    "color": "Blue",
    "layerHeight": 0.2,
    "infill": 20,
    "quantity": 1,
    "shippingMethod": "pickup",
    "price": 30.00
  }'
```

### Test 3: Create Design Request
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "design",
    "projectName": "Test Design",
    "ideaDescription": "Test description for migration verification",
    "usageType": "functional",
    "requestChat": true
  }'
```

---

## ✅ Success Indicators

- [ ] Both tables created without errors
- [ ] Data counts match old table
- [ ] All 12 indices created
- [ ] `all_orders` view works
- [ ] Server restarts without errors
- [ ] Can create print job via API
- [ ] Can create design request via API
- [ ] Admin dashboard shows orders
- [ ] No database errors in logs

---

## 🔧 Troubleshooting

### Error: "table already exists"

**Solution:** Tables already created! Skip to Step 4 verification.

### Error: "relation does not exist"

**Solution:** Check you're connected to the correct Supabase project.

### Data mismatch in counts

**Solution:** Check the `order_type` column in old orders:

```sql
SELECT 
    order_type,
    COUNT(*) 
FROM orders 
GROUP BY order_type;
```

### Server errors after migration

**Solution:** 
1. Check server logs for errors
2. Verify environment variables
3. Restart server: `npm run dev`

### Orders not showing in dashboard

**Solution:**
```sql
-- Check RLS policies are working
SELECT * FROM print_jobs LIMIT 5;
SELECT * FROM design_requests LIMIT 5;
```

---

## 📞 Need Help?

### Check Migration Status

Run in Supabase SQL Editor:

```sql
-- Migration verification script
DO $$ 
DECLARE
    print_jobs_exists BOOLEAN;
    design_requests_exists BOOLEAN;
    view_exists BOOLEAN;
BEGIN
    -- Check tables
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'print_jobs'
    ) INTO print_jobs_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'design_requests'
    ) INTO design_requests_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'all_orders'
    ) INTO view_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Migration Status ===';
    RAISE NOTICE 'print_jobs table: %', CASE WHEN print_jobs_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'design_requests table: %', CASE WHEN design_requests_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'all_orders view: %', CASE WHEN view_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '';
    
    IF print_jobs_exists AND design_requests_exists AND view_exists THEN
        RAISE NOTICE '✅ Migration Complete!';
    ELSE
        RAISE NOTICE '⚠️  Migration Incomplete - Run migration script';
    END IF;
END $$;
```

---

## 🎉 Next Steps After Successful Migration

1. ✅ Test creating orders from your application
2. ✅ Verify admin dashboard displays correctly
3. ✅ Check user dashboard shows their orders
4. ✅ Test status updates
5. ✅ Verify conversations auto-create

**Optional:** After verifying everything works for 1-2 days, you can rename the old `orders` table:

```sql
-- Rename old table to backup (OPTIONAL - only after verification)
ALTER TABLE orders RENAME TO orders_backup_2026_01_11;

COMMENT ON TABLE orders_backup_2026_01_11 IS 
  'Backup of orders table before separation into print_jobs and design_requests';
```

---

**Migration Date:** January 11, 2026  
**Status:** Ready to Execute  
**Backup:** Old table preserved automatically
