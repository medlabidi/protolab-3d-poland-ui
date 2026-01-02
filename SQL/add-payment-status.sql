-- Add payment_status and paid_amount columns to orders table
-- Run this migration to enable payment tracking for order modifications

-- Add payment_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' 
CHECK (payment_status IN ('paid', 'on_hold', 'refunding', 'refunded'));

-- Add paid_amount column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2);

-- Update status column to support new statuses
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('submitted', 'in_queue', 'printing', 'finished', 'delivered', 'on_hold', 'suspended'));

-- Update existing orders: set paid_amount equal to price, payment_status to 'paid'
UPDATE orders 
SET paid_amount = price, payment_status = 'paid' 
WHERE paid_amount IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_status IS 'Payment status: paid, on_hold (awaiting refund processing), refunding (refund in progress), refunded (cancelled orders)';
COMMENT ON COLUMN orders.paid_amount IS 'The amount actually paid by the customer (may differ from price after modifications)';
