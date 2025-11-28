-- Add delivery and model analysis columns to print_jobs table
-- These columns store delivery information and 3D model analysis data

-- Check if print_jobs table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'print_jobs') THEN
    RAISE EXCEPTION 'print_jobs table does not exist. Please create it first.';
  END IF;
END $$;

-- Add delivery-related columns
ALTER TABLE print_jobs
  ADD COLUMN IF NOT EXISTS delivery_option_id UUID REFERENCES delivery_options(id),
  ADD COLUMN IF NOT EXISTS locker_id TEXT,
  ADD COLUMN IF NOT EXISTS locker_name TEXT,
  ADD COLUMN IF NOT EXISTS locker_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Add model analysis columns
ALTER TABLE print_jobs
  ADD COLUMN IF NOT EXISTS model_volume_cm3 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS model_weight_grams DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS model_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS model_surface_area DECIMAL(10,2);

-- Add price breakdown columns
ALTER TABLE print_jobs
  ADD COLUMN IF NOT EXISTS price_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0.00;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_print_jobs_delivery_option ON print_jobs(delivery_option_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_locker_id ON print_jobs(locker_id);

-- Add check constraint for shipping address validation
ALTER TABLE print_jobs
  ADD CONSTRAINT check_dpd_address 
  CHECK (
    delivery_option_id != (SELECT id FROM delivery_options WHERE name = 'dpd')
    OR shipping_address IS NOT NULL
  );

-- Add check constraint for InPost locker validation
ALTER TABLE print_jobs
  ADD CONSTRAINT check_inpost_locker 
  CHECK (
    delivery_option_id != (SELECT id FROM delivery_options WHERE name = 'inpost')
    OR locker_id IS NOT NULL
  );

-- Add comments
COMMENT ON COLUMN print_jobs.delivery_option_id IS 'Reference to delivery_options table';
COMMENT ON COLUMN print_jobs.locker_id IS 'InPost locker ID (for InPost delivery)';
COMMENT ON COLUMN print_jobs.locker_name IS 'InPost locker name (for InPost delivery)';
COMMENT ON COLUMN print_jobs.locker_address IS 'InPost locker full address (for InPost delivery)';
COMMENT ON COLUMN print_jobs.shipping_address IS 'JSON object with DPD delivery address: {fullName, phone, street, city, postalCode}';
COMMENT ON COLUMN print_jobs.model_volume_cm3 IS 'Model volume in cubic centimeters (from 3D analysis)';
COMMENT ON COLUMN print_jobs.model_weight_grams IS 'Estimated model weight in grams (volume × material density)';
COMMENT ON COLUMN print_jobs.model_dimensions IS 'JSON object with bounding box dimensions: {x, y, z} in mm';
COMMENT ON COLUMN print_jobs.model_surface_area IS 'Model surface area in cm²';
COMMENT ON COLUMN print_jobs.price_breakdown IS 'JSON object with cost breakdown: {material, energy, depreciation, maintenance, vat}';
COMMENT ON COLUMN print_jobs.delivery_cost IS 'Delivery cost in PLN';

-- Sample JSONB structure for reference:
-- shipping_address: {"fullName": "Jan Kowalski", "phone": "+48123456789", "street": "ul. Przykładowa 10/5", "city": "Kraków", "postalCode": "30-001"}
-- model_dimensions: {"x": 100.5, "y": 50.3, "z": 25.7}
-- price_breakdown: {"material": 15.60, "energy": 0.98, "depreciation": 2.79, "maintenance": 0.01, "vat": 4.47, "total": 23.85}
