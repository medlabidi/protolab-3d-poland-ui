-- Create Materials Table
-- This table stores all available 3D printing materials

CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- PLA, PETG, TPU, Nylon, ABS, Resin, etc.
  color VARCHAR(7) DEFAULT '#FFFFFF', -- Hex color code
  price_per_kg DECIMAL(10,2) NOT NULL,
  density DECIMAL(5,3) DEFAULT 1.24, -- g/cm³
  stock_quantity DECIMAL(10,2) DEFAULT 0, -- kg
  print_temp INTEGER, -- °C
  bed_temp INTEGER, -- °C
  supplier VARCHAR(255),
  last_restocked DATE,
  reorder_point DECIMAL(10,2) DEFAULT 1.0, -- kg threshold for reordering
  is_active BOOLEAN DEFAULT true, -- visibility control
  image_url TEXT, -- URL to material image
  description TEXT, -- Material description
  properties JSONB, -- Additional properties (strength, flexibility, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_stock ON materials(stock_quantity);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materials_timestamp
BEFORE UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION update_materials_updated_at();

-- Insert default materials
INSERT INTO materials (name, type, color, price_per_kg, density, stock_quantity, print_temp, bed_temp, supplier, last_restocked, is_active, description) VALUES
('PLA - White', 'PLA', '#FFFFFF', 18.99, 1.24, 5.2, 200, 60, 'Prusament', CURRENT_DATE - INTERVAL '8 days', true, 'Standard white PLA filament, excellent for beginners'),
('PLA - Black', 'PLA', '#000000', 18.99, 1.24, 3.8, 200, 60, 'Prusament', CURRENT_DATE - INTERVAL '13 days', true, 'Matte black PLA filament with great surface finish'),
('PETG - Clear', 'PETG', '#E8F4F8', 24.99, 1.27, 2.1, 230, 80, 'Prusament', CURRENT_DATE - INTERVAL '21 days', true, 'Transparent PETG with high strength and durability'),
('PETG - Orange', 'PETG', '#FF8C00', 24.99, 1.27, 2.5, 230, 80, 'Prusament', CURRENT_DATE - INTERVAL '15 days', true, 'Vibrant orange PETG for functional parts'),
('TPU - Flexible Red', 'TPU', '#FF6B6B', 39.99, 1.21, 0.9, 220, 60, 'NinjaTek', CURRENT_DATE - INTERVAL '26 days', true, 'Flexible TPU filament perfect for flexible prints'),
('Nylon - Natural', 'Nylon', '#F5E6D3', 34.99, 1.14, 1.5, 240, 85, 'MatterHackers', CURRENT_DATE - INTERVAL '9 days', true, 'Strong nylon filament for engineering applications'),
('ABS - Blue', 'ABS', '#4169E1', 22.99, 1.04, 3.2, 240, 100, 'ColorFabb', CURRENT_DATE - INTERVAL '18 days', true, 'Heat-resistant ABS filament in royal blue'),
('PLA - Silver', 'PLA', '#C0C0C0', 19.99, 1.24, 2.8, 200, 60, 'eSun', CURRENT_DATE - INTERVAL '12 days', true, 'Metallic silver PLA with shimmering finish'),
('PETG - Green', 'PETG', '#00FF00', 24.99, 1.27, 1.8, 230, 80, 'Polymaker', CURRENT_DATE - INTERVAL '22 days', true, 'Bright green PETG for outdoor applications'),
('TPU - Flexible Black', 'TPU', '#000000', 39.99, 1.21, 1.2, 220, 60, 'NinjaTek', CURRENT_DATE - INTERVAL '19 days', true, 'Black flexible TPU for shock absorption')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (adjust as needed)
-- ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON materials FOR SELECT USING (is_active = true);
-- CREATE POLICY "Enable full access for admins" ON materials FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
