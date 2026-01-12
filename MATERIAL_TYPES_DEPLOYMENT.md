# Material Types System - Deployment Guide

## Overview
This update removes the Stock (kg) field from the materials management and implements an independent material types system where types can exist without having materials/colors assigned.

## Changes Made

### 1. Frontend Changes (AdminMaterials.tsx)
- ✅ Removed Stock (kg) input field from Add Material dialog
- ✅ Removed Stock (kg) input field from Edit Material dialog  
- ✅ Added material_types state to fetch from API
- ✅ Updated getUniqueTypes() to use API data instead of extracting from materials
- ✅ Updated Add Type dialog to save to material_types API
- ✅ Added description field for material types

### 2. Backend Changes (api/index.ts)
- ✅ Added handleAdminGetMaterialTypes - GET /api/admin/material-types
- ✅ Added handleAdminCreateMaterialType - POST /api/admin/material-types
- ✅ Added handleAdminUpdateMaterialType - PATCH /api/admin/material-types
- ✅ Added handleAdminDeleteMaterialType - DELETE /api/admin/material-types
- ✅ All endpoints have proper auth checks and error handling

### 3. Database Changes
- ✅ Created SQL migration file: SQL/create-material-types-table.sql

## Deployment Steps

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy and paste the entire content of `SQL/create-material-types-table.sql`
6. Click "Run" to execute the migration

The migration will:
- Create material_types table with proper structure
- Migrate existing material types from materials table
- Add indexes for performance
- Add material_type_id foreign key column to materials table
- Set up update trigger for updated_at timestamp

### Step 2: Verify Migration

Run this query in Supabase SQL Editor to verify:

```sql
-- Check material_types table
SELECT * FROM material_types ORDER BY name;

-- Check if material_type_id column was added to materials
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materials' AND column_name = 'material_type_id';
```

### Step 3: Deploy to Vercel

Run in terminal:
```bash
vercel --prod
```

### Step 4: Test the Changes

1. Login to admin panel: https://your-domain.com/admin
2. Go to Materials page
3. Test adding a new material type:
   - Click "Add Type" button
   - Enter a name (e.g., "Carbon Fiber")
   - Add description (optional)
   - Click "Add Type"
4. Verify material type appears in the dropdown when adding materials
5. Test adding a material WITHOUT assigning colors (material types are now independent!)
6. Verify Stock (kg) field is removed from both Add and Edit dialogs

## Rollback Plan

If issues occur:

1. Frontend rollback:
```bash
git revert HEAD
git push
vercel --prod
```

2. Database rollback (if needed):
```sql
-- Drop the foreign key constraint
ALTER TABLE materials DROP COLUMN IF EXISTS material_type_id;

-- Drop material_types table
DROP TABLE IF EXISTS material_types CASCADE;
```

## Notes

- Material types are now independent entities that can exist without materials
- The old material_type column in materials table is kept for backwards compatibility
- The new material_type_id column allows for stricter relationships in the future
- Stock quantity is still tracked in the database but not shown in the UI (only stock status)
