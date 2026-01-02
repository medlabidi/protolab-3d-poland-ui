-- Migration: Add advanced print settings columns to orders table
-- Run this migration to support custom layer height, infill, support type, and infill pattern

-- Add support_type column (none, normal, tree)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS support_type TEXT DEFAULT 'none' 
CHECK (support_type IN ('none', 'normal', 'tree'));

-- Add infill_pattern column (grid, honeycomb, triangles, gyroid)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS infill_pattern TEXT DEFAULT 'grid' 
CHECK (infill_pattern IN ('grid', 'honeycomb', 'triangles', 'gyroid'));

-- Add custom_layer_height column (optional override of quality-based layer height)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS custom_layer_height DOUBLE PRECISION
CHECK (custom_layer_height IS NULL OR (custom_layer_height >= 0.1 AND custom_layer_height <= 0.5));

-- Add custom_infill column (optional override of quality-based infill)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS custom_infill INTEGER
CHECK (custom_infill IS NULL OR (custom_infill >= 0 AND custom_infill <= 100));

-- Add comment to table
COMMENT ON COLUMN public.orders.support_type IS 'Support structure type: none (no supports), normal (+15% material, +10% time), tree (+10% material, +5% time)';
COMMENT ON COLUMN public.orders.infill_pattern IS 'Infill pattern: grid (standard), honeycomb (+5% time), triangles (standard), gyroid (+5% time)';
COMMENT ON COLUMN public.orders.custom_layer_height IS 'Custom layer height in mm (overrides quality-based default if set)';
COMMENT ON COLUMN public.orders.custom_infill IS 'Custom infill percentage (overrides quality-based default if set)';

-- Update existing orders to have default values
UPDATE public.orders 
SET support_type = 'none', infill_pattern = 'grid'
WHERE support_type IS NULL OR infill_pattern IS NULL;
