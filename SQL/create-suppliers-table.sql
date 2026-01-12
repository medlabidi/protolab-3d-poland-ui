-- Create suppliers table for managing material suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(500),
  
  -- Address Information
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Poland',
  
  -- Business Details
  tax_id VARCHAR(50), -- NIP in Poland
  registration_number VARCHAR(100),
  
  -- Supply Information
  materials_supplied TEXT[], -- Array of material types they supply
  lead_time_days INTEGER DEFAULT 7, -- Average delivery time
  minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'PLN',
  
  -- Quality & Ratings
  quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 5), -- 0-5 stars
  reliability_rating DECIMAL(3,2) CHECK (reliability_rating >= 0 AND reliability_rating <= 5),
  price_rating DECIMAL(3,2) CHECK (price_rating >= 0 AND price_rating <= 5),
  
  -- Financial
  payment_terms VARCHAR(100), -- e.g., "Net 30", "Prepayment", "COD"
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Status & Tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  is_preferred BOOLEAN DEFAULT FALSE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  
  -- Notes & Documents
  notes TEXT,
  contract_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb, -- Array of document links
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_order_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON public.suppliers(is_preferred);
CREATE INDEX IF NOT EXISTS idx_suppliers_materials ON public.suppliers USING GIN (materials_supplied);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON public.suppliers(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin users can do everything
CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Regular users can only view active suppliers
CREATE POLICY "Users can view active suppliers"
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Insert some default suppliers
INSERT INTO public.suppliers (name, company_name, email, phone, address, city, postal_code, materials_supplied, status, is_preferred)
VALUES 
  (
    'PolyMaker Poland',
    'PolyMaker Technologies Sp. z o.o.',
    'contact@polymaker.pl',
    '+48 22 123 4567',
    'ul. Technologiczna 5',
    'Warsaw',
    '02-677',
    ARRAY['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'],
    'active',
    TRUE
  ),
  (
    'Spectrum Filaments',
    'Spectrum Group Sp. z o.o.',
    'info@spectrumfilaments.com',
    '+48 12 345 6789',
    'ul. Przemysłowa 15',
    'Peczniów',
    '26-020',
    ARRAY['PLA', 'PETG', 'ABS', 'ASA', 'PC'],
    'active',
    TRUE
  ),
  (
    'Rosa3D',
    'Rosa3D Sp. z o.o.',
    'biuro@rosa3d.pl',
    '+48 61 234 5678',
    'ul. Poznańska 123',
    'Poznań',
    '61-232',
    ARRAY['PLA', 'PETG', 'Resin', 'TPU'],
    'active',
    FALSE
  ),
  (
    'Devil Design',
    'Devil Design Sp. z o.o.',
    'sklep@devildesign.pl',
    '+48 71 789 0123',
    'ul. Fabryczna 7',
    'Wrocław',
    '53-609',
    ARRAY['PLA', 'PETG', 'ABS', 'HIPS', 'Silk PLA'],
    'active',
    FALSE
  )
ON CONFLICT (name) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.suppliers IS 'Suppliers management table for tracking material suppliers and their information';
