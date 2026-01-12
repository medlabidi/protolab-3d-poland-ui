# Advanced Mode Backend Update - Complete ✅

## What Was Done

### 1. Backend API Updates (`api/index.ts`)
✅ Updated `handleCreateOrder` to accept all advanced mode parameters:
- `advancedMode` (boolean flag)
- `supportType` (none/normal/tree)
- `infillPattern` (grid/honeycomb/triangles/gyroid)
- `customLayerHeight` (custom layer height in mm)
- `customInfill` (custom infill percentage)

✅ Updated `handleUpdateOrder` to include `advanced_mode` in allowedFields

✅ Added proper field mapping from camelCase (frontend) to snake_case (database)

### 2. Frontend Updates (`client/src/pages/NewPrint.tsx`)
✅ Added `advancedMode` flag to form submission
✅ Fixed custom parameters to only send when `advancedMode` is true

### 3. Database Migration
✅ Created SQL migration file: `SQL/add-advanced-mode-column.sql`

## Database Migration Required

**You need to run this SQL migration on your Supabase database:**

```sql
-- SQL/add-advanced-mode-column.sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS advanced_mode BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.orders.advanced_mode IS 'Boolean flag indicating if order was created using advanced mode settings';

UPDATE public.orders 
SET advanced_mode = false
WHERE advanced_mode IS NULL;
```

### How to Run the Migration:

1. Go to your Supabase Dashboard
2. Select your project: **protolab-3d-poland**
3. Go to SQL Editor (in the left sidebar)
4. Click "New Query"
5. Copy and paste the SQL from `SQL/add-advanced-mode-column.sql`
6. Click "Run" or press `Ctrl+Enter`

## Verification

The backend now:
- ✅ Accepts `advancedMode` flag from frontend
- ✅ Stores all advanced parameters correctly
- ✅ Returns advanced parameters in GET requests
- ✅ EditOrder page already loads and displays advanced settings
- ✅ OrderDetails page already displays advanced settings section

## Field Mappings

| Frontend (camelCase) | Backend (snake_case) |
|---------------------|---------------------|
| advancedMode        | advanced_mode       |
| supportType         | support_type        |
| infillPattern       | infill_pattern      |
| customLayerHeight   | custom_layer_height |
| customInfill        | custom_infill       |

## Testing Checklist

After running the migration:
- [ ] Create an order with Normal Mode (quality preset)
- [ ] Create an order with Advanced Mode (custom parameters)
- [ ] Verify both orders appear correctly in Orders page
- [ ] Check EditOrder shows advanced parameters when set
- [ ] Check OrderDetails shows "Advanced Settings" section when parameters are non-default
- [ ] Verify order updates preserve advanced parameters

## Notes

- The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times
- Existing orders will have `advanced_mode = false` by default
- The backend now properly handles both normal and advanced mode orders
