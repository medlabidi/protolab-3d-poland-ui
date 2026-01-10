-- Add Design Assistance fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS design_description TEXT,
ADD COLUMN IF NOT EXISTS design_requirements TEXT,
ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id);

-- Create index for parent_order_id
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

-- Add comment
COMMENT ON COLUMN orders.design_description IS 'Description of the design project (for order_type=design)';
COMMENT ON COLUMN orders.design_requirements IS 'Specific requirements for the design (for order_type=design)';
COMMENT ON COLUMN orders.reference_images IS 'Array of reference image URLs (for order_type=design)';
COMMENT ON COLUMN orders.parent_order_id IS 'Reference to parent order (e.g., design order that created this print order)';
