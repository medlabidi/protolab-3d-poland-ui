-- ============================================
-- Migration: Make Non-Essential Printer Fields Nullable
-- Date: 2026-01-11
-- Description: Remove NOT NULL constraints from printer fields that aren't required for basic operation
-- ============================================

-- Make these fields nullable (they can have defaults or be filled in later)
ALTER TABLE printers ALTER COLUMN power_watts DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN cost_pln DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN lifespan_hours DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN maintenance_rate DROP NOT NULL;

-- Set defaults for these columns
ALTER TABLE printers ALTER COLUMN power_watts SET DEFAULT 0;
ALTER TABLE printers ALTER COLUMN cost_pln SET DEFAULT 0;
ALTER TABLE printers ALTER COLUMN lifespan_hours SET DEFAULT 5000;
ALTER TABLE printers ALTER COLUMN maintenance_rate SET DEFAULT 0.03;

COMMENT ON COLUMN printers.power_watts IS 'Power consumption in watts (optional)';
COMMENT ON COLUMN printers.cost_pln IS 'Purchase cost in PLN (optional)';
COMMENT ON COLUMN printers.lifespan_hours IS 'Expected lifespan in hours (optional, default 5000)';
COMMENT ON COLUMN printers.maintenance_rate IS 'Maintenance cost multiplier (optional, default 3%)';
