-- Add model_volume_cm3 column to orders table for exact price recalculation
-- This stores the base 3D model volume in cubic centimeters (cm³)
-- Used in EditOrder to calculate prices exactly like NewPrint without back-calculation
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10, 3);

COMMENT ON COLUMN orders.model_volume_cm3 IS 'Base 3D model volume in cm³, used for exact price recalculation when editing orders';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'model_volume_cm3';
