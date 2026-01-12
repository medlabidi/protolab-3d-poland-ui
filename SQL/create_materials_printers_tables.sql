-- Materials table: Store available 3D printing materials with colors and pricing
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type VARCHAR(50) NOT NULL, -- PLA, ABS, PETG, etc.
  color VARCHAR(50) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL, -- Price in PLN per kilogram
  stock_status VARCHAR(20) DEFAULT 'available', -- available, low_stock, out_of_stock
  lead_time_days INTEGER DEFAULT 0, -- Extra processing days when unavailable
  hex_color VARCHAR(7), -- Color hex code for display (#FFFFFF)
  description TEXT, -- Additional info about the material
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_type, color)
);

-- Printers table: Store 3D printer specifications for pricing calculations
CREATE TABLE IF NOT EXISTS printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  model VARCHAR(100),
  power_watts DECIMAL(10, 2) NOT NULL, -- Power consumption in watts
  cost_pln DECIMAL(10, 2) NOT NULL, -- Purchase cost in PLN
  lifespan_hours INTEGER NOT NULL, -- Expected lifespan in hours
  maintenance_rate DECIMAL(5, 4) DEFAULT 0.03, -- Maintenance multiplier (3%)
  build_volume_x INTEGER, -- Build volume in mm
  build_volume_y INTEGER,
  build_volume_z INTEGER,
  max_print_speed INTEGER, -- mm/s
  nozzle_diameter DECIMAL(4, 2), -- mm
  layer_height_min DECIMAL(4, 2), -- mm
  layer_height_max DECIMAL(4, 2), -- mm
  supported_materials TEXT[], -- Array of material types (PLA, ABS, etc.)
  status VARCHAR(20) DEFAULT 'operational', -- operational, maintenance, offline
  is_default BOOLEAN DEFAULT false, -- Whether this is the default printer for pricing
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT only_one_default CHECK (
    is_default = false OR 
    (SELECT COUNT(*) FROM printers WHERE is_default = true AND id != printers.id) = 0
  )
);

-- Insert default materials based on current hardcoded values
INSERT INTO materials (material_type, color, price_per_kg, stock_status, hex_color) VALUES
-- PLA Materials
('PLA', 'White', 39.00, 'available', '#FFFFFF'),
('PLA', 'Black', 39.00, 'available', '#000000'),
('PLA', 'Red', 49.00, 'available', '#FF0000'),
('PLA', 'Yellow', 49.00, 'available', '#FFFF00'),
('PLA', 'Blue', 49.00, 'available', '#0000FF'),

-- ABS Materials
('ABS', 'Silver', 50.00, 'available', '#C0C0C0'),
('ABS', 'Transparent', 50.00, 'available', '#FFFFFF'),
('ABS', 'Black', 50.00, 'available', '#000000'),
('ABS', 'Grey', 50.00, 'available', '#808080'),
('ABS', 'Red', 50.00, 'available', '#FF0000'),
('ABS', 'White', 50.00, 'available', '#FFFFFF'),
('ABS', 'Blue', 50.00, 'available', '#0000FF'),
('ABS', 'Green', 50.00, 'available', '#00FF00'),

-- PETG Materials
('PETG', 'Black', 30.00, 'available', '#000000'),
('PETG', 'White', 35.00, 'available', '#FFFFFF'),
('PETG', 'Red', 39.00, 'available', '#FF0000'),
('PETG', 'Green', 39.00, 'available', '#00FF00'),
('PETG', 'Blue', 39.00, 'available', '#0000FF'),
('PETG', 'Yellow', 39.00, 'available', '#FFFF00'),
('PETG', 'Pink', 39.00, 'available', '#FFC0CB'),
('PETG', 'Orange', 39.00, 'available', '#FFA500'),
('PETG', 'Silver', 39.00, 'available', '#C0C0C0')
ON CONFLICT (material_type, color) DO NOTHING;

-- Insert default printer based on current hardcoded values
INSERT INTO printers (
  name, 
  model, 
  power_watts, 
  cost_pln, 
  lifespan_hours, 
  maintenance_rate,
  build_volume_x,
  build_volume_y,
  build_volume_z,
  supported_materials,
  status,
  is_default
) VALUES (
  'Primary Printer',
  'Generic FDM Printer',
  270.00, -- 0.27 kW
  3483.39,
  5000,
  0.03,
  220,
  220,
  250,
  ARRAY['PLA', 'ABS', 'PETG'],
  'operational',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(stock_status);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_printers_status ON printers(status);
CREATE INDEX IF NOT EXISTS idx_printers_active ON printers(is_active);
CREATE INDEX IF NOT EXISTS idx_printers_default ON printers(is_default);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printers_updated_at
  BEFORE UPDATE ON printers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
