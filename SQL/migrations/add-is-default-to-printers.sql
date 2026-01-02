-- Migration: Add is_default column to printers table
-- Date: 2025-12-15
-- Description: Adds a default printer flag to allow users to designate which printer is used for pricing calculations

-- Add is_default column
ALTER TABLE printers ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_printers_default ON printers(is_default);

-- Set the first operational printer as default if no default exists
UPDATE printers 
SET is_default = true 
WHERE id = (
  SELECT id FROM printers 
  WHERE status = 'operational' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM printers WHERE is_default = true);

-- Verify the migration
SELECT 
  id, 
  name, 
  is_default, 
  status, 
  is_active 
FROM printers 
ORDER BY is_default DESC, created_at ASC;
