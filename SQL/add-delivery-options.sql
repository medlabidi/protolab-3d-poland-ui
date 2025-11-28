-- Add delivery options table
-- This table stores available delivery methods with their pricing

CREATE TABLE IF NOT EXISTS delivery_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default delivery options
INSERT INTO delivery_options (name, display_name, price, description) VALUES
  ('pickup', 'Local Pickup', 0.00, 'Free pickup at our facility in Krakow. Available Monday-Friday 9:00-17:00.'),
  ('inpost', 'InPost Paczkomat', 12.00, 'Delivery to InPost locker of your choice. Available 24/7.'),
  ('dpd', 'DPD Courier', 25.00, 'Home delivery via DPD courier. Delivery within 2-3 business days.')
ON CONFLICT (name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_options_active ON delivery_options(is_active);

-- Add comment
COMMENT ON TABLE delivery_options IS 'Available delivery methods with pricing information';
