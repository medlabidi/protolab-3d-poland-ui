-- ============================================
-- Migration: Add Detailed Printer Specifications
-- Date: 2026-01-11
-- Description: Add brand, model, build volume, multi-color printing, nozzle specs, purchase price, and lifespan
-- ============================================

BEGIN;

-- Add new columns to printers table
ALTER TABLE printers ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS printer_model VARCHAR(255);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS max_build_volume VARCHAR(100); -- e.g., "220x220x250mm"
ALTER TABLE printers ADD COLUMN IF NOT EXISTS multi_color_printing BOOLEAN DEFAULT false;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS max_colors INTEGER DEFAULT 1;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS available_nozzle_diameters TEXT; -- e.g., "0.2, 0.4, 0.6, 0.8"
ALTER TABLE printers ADD COLUMN IF NOT EXISTS actual_nozzle_diameter DECIMAL(4, 2); -- e.g., 0.40
ALTER TABLE printers ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS lifespan_years INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN printers.brand IS 'Printer brand/manufacturer (e.g., Prusa, Creality)';
COMMENT ON COLUMN printers.printer_model IS 'Printer model (e.g., i3 MK3S+, Ender 3)';
COMMENT ON COLUMN printers.max_build_volume IS 'Maximum build volume in format WxDxH (e.g., 220x220x250mm)';
COMMENT ON COLUMN printers.multi_color_printing IS 'Whether the printer supports multi-color printing';
COMMENT ON COLUMN printers.max_colors IS 'Maximum number of colors that can be printed at once';
COMMENT ON COLUMN printers.available_nozzle_diameters IS 'Available nozzle diameters as comma-separated values';
COMMENT ON COLUMN printers.actual_nozzle_diameter IS 'Currently installed nozzle diameter in mm';
COMMENT ON COLUMN printers.purchase_price IS 'Purchase price in PLN';
COMMENT ON COLUMN printers.lifespan_years IS 'Expected lifespan in years';

COMMIT;
