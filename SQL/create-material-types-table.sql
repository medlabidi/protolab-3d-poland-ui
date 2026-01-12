-- Create material_types table for independent material type management
-- This allows material types to exist without requiring material colors to be assigned

CREATE TABLE IF NOT EXISTS material_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_material_types_name ON material_types(name);
CREATE INDEX IF NOT EXISTS idx_material_types_is_active ON material_types(is_active);

-- Migrate existing material types from materials table
INSERT INTO material_types (name, is_active)
SELECT DISTINCT material_type, true
FROM materials
WHERE material_type IS NOT NULL AND material_type != ''
ON CONFLICT (name) DO NOTHING;

-- Add foreign key to materials table (optional, for future use)
-- This maintains backwards compatibility while allowing the relationship
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS material_type_id INTEGER REFERENCES material_types(id);

-- Update material_type_id based on existing material_type strings
UPDATE materials m
SET material_type_id = mt.id
FROM material_types mt
WHERE m.material_type = mt.name;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER material_types_updated_at
BEFORE UPDATE ON material_types
FOR EACH ROW
EXECUTE FUNCTION update_material_types_updated_at();

-- Note: We keep the material_type column in materials for backwards compatibility
-- The material_type_id is optional and can be used for stricter relationships later
