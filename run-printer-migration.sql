-- Run this in your Supabase SQL Editor

-- Step 1: Make non-essential fields nullable
ALTER TABLE printers ALTER COLUMN power_watts DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN cost_pln DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN lifespan_hours DROP NOT NULL;
ALTER TABLE printers ALTER COLUMN maintenance_rate DROP NOT NULL;

-- Set defaults for these columns
ALTER TABLE printers ALTER COLUMN power_watts SET DEFAULT 0;
ALTER TABLE printers ALTER COLUMN cost_pln SET DEFAULT 0;
ALTER TABLE printers ALTER COLUMN lifespan_hours SET DEFAULT 5000;
ALTER TABLE printers ALTER COLUMN maintenance_rate SET DEFAULT 0.03;

-- Step 2: Add new columns to printers table
ALTER TABLE printers ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS printer_model VARCHAR(255);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS multi_color_printing BOOLEAN DEFAULT false;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS max_colors INTEGER DEFAULT 1;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS available_nozzle_diameters TEXT;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS actual_nozzle_diameter DECIMAL(4, 2);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS lifespan_years INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN printers.brand IS 'Printer brand/manufacturer (e.g., Prusa, Creality)';
COMMENT ON COLUMN printers.printer_model IS 'Printer model (e.g., i3 MK3S+, Ender 3)';
COMMENT ON COLUMN printers.multi_color_printing IS 'Whether the printer supports multi-color printing';
COMMENT ON COLUMN printers.max_colors IS 'Maximum number of colors that can be printed at once';
COMMENT ON COLUMN printers.available_nozzle_diameters IS 'Available nozzle diameters as comma-separated values';
COMMENT ON COLUMN printers.actual_nozzle_diameter IS 'Currently installed nozzle diameter in mm';
COMMENT ON COLUMN printers.lifespan_years IS 'Expected lifespan in years';
