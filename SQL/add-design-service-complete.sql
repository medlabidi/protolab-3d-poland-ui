-- Comprehensive migration for design service functionality
-- This adds all columns needed for both print and design orders

-- Add order_type if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'print';

-- Add check constraint to ensure order_type is either 'print' or 'design'
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_order_type') THEN
    ALTER TABLE orders 
    ADD CONSTRAINT check_order_type 
    CHECK (order_type IN ('print', 'design'));
  END IF;
END $$;

-- Add design-specific fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS design_description TEXT,
ADD COLUMN IF NOT EXISTS design_usage TEXT,
ADD COLUMN IF NOT EXISTS design_usage_details TEXT,
ADD COLUMN IF NOT EXISTS design_dimensions TEXT,
ADD COLUMN IF NOT EXISTS design_requirements TEXT,
ADD COLUMN IF NOT EXISTS reference_images TEXT[],
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

-- Add comments for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: print (standard 3D printing) or design (design assistance request)';
COMMENT ON COLUMN orders.design_description IS 'Description of what the user wants designed';
COMMENT ON COLUMN orders.design_usage IS 'What the design will be used for (e.g., Prototyping, Final Product, etc.)';
COMMENT ON COLUMN orders.design_usage_details IS 'Additional details about the intended usage';
COMMENT ON COLUMN orders.design_dimensions IS 'Approximate dimensions for the design';
COMMENT ON COLUMN orders.design_requirements IS 'Additional requirements and specifications (for design orders)';
COMMENT ON COLUMN orders.reference_images IS 'Array of reference image URLs (for design orders)';
COMMENT ON COLUMN orders.parent_order_id IS 'Reference to parent design order if this is a print order created from a design';
