-- Add order_type column and design-specific fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'print',
ADD COLUMN IF NOT EXISTS design_description TEXT,
ADD COLUMN IF NOT EXISTS design_requirements TEXT,
ADD COLUMN IF NOT EXISTS reference_images TEXT[],
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id);

-- Add check constraint to ensure order_type is either 'print' or 'design'
ALTER TABLE orders 
ADD CONSTRAINT check_order_type 
CHECK (order_type IN ('print', 'design'));

-- Backfill existing orders: set order_type based on file_name patterns
UPDATE orders 
SET order_type = 'design'
WHERE order_type = 'print' 
AND (
  file_name ILIKE '%design%' OR 
  file_name ILIKE '%assistance%' OR 
  file_name ILIKE '%request%'
);

-- Create index on order_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Create index on parent_order_id for linked orders
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

-- Comments for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: print (standard 3D printing) or design (design assistance request)';
COMMENT ON COLUMN orders.design_description IS 'Description of the design project (for design orders)';
COMMENT ON COLUMN orders.design_requirements IS 'Specific requirements and specifications (for design orders)';
COMMENT ON COLUMN orders.reference_images IS 'Array of reference image URLs (for design orders)';
COMMENT ON COLUMN orders.parent_order_id IS 'Reference to parent design order if this is a print order created from a design';
