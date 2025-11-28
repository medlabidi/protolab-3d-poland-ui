# Database Migration Required

To fix the print job saving issue, you need to run the following SQL commands in your Supabase SQL Editor:

## Steps:

1. Go to https://supabase.com/dashboard
2. Select your project (ejauqqpatmqbxxhbmkzp)
3. Go to **SQL Editor**
4. Create a new query and paste the SQL below
5. Click **Run**

## SQL Commands:

```sql
-- Add shipping_address column to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Drop the existing check constraint for shipping_method
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_shipping_method_check;

-- Add updated check constraint with 'dpd' option
ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_method_check 
  CHECK (shipping_method IN ('pickup', 'inpost', 'dpd', 'courier'));

-- Add comment for documentation
COMMENT ON COLUMN public.orders.shipping_address IS 'JSON string with delivery address for DPD/courier or InPost locker details';
```

## What This Does:

1. **Adds `shipping_address` column**: Stores delivery address as text (JSON string)
2. **Updates shipping_method constraint**: Adds 'dpd' as a valid shipping method alongside 'pickup', 'inpost', and 'courier'
3. **Adds documentation**: Comments explain what the column is for

## After Running:

The print job creation should work properly and save orders to the database with file uploads to Supabase storage.
