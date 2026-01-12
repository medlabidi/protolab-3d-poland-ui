-- Migration: Add advanced_mode flag to orders table
-- Run this migration to add a boolean flag tracking if order used advanced mode

-- Add advanced_mode flag (boolean to track if user chose advanced mode)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS advanced_mode BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.orders.advanced_mode IS 'Boolean flag indicating if order was created using advanced mode settings';

-- Update existing orders to have default value
UPDATE public.orders 
SET advanced_mode = false
WHERE advanced_mode IS NULL;
