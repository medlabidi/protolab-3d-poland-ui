-- Update orders table to add shipping_address and support dpd delivery method
-- This migration adds the shipping_address column and updates the shipping_method constraint

-- Add shipping_address column to store delivery address (JSONB for flexibility)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Drop the existing check constraint for shipping_method
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_shipping_method_check;

-- Add updated check constraint with 'dpd' option
ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_method_check 
  CHECK (shipping_method IN ('pickup', 'inpost', 'dpd', 'courier'));

-- Add comment for shipping_address column
COMMENT ON COLUMN public.orders.shipping_address IS 'JSON string with delivery address for DPD/courier or InPost locker details';

-- Sample JSONB structure:
-- DPD: {"fullName": "Jan Kowalski", "phone": "+48123456789", "street": "ul. Przykładowa 10/5", "city": "Kraków", "postalCode": "30-001"}
-- InPost: {"lockerCode": "KRA01A", "lockerAddress": "ul. Długa 10, 31-147 Kraków"}
