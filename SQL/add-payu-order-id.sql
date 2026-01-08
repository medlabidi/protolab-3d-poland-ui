-- Migration: Add payu_order_id column to orders table
-- This stores PayU's orderId for tracking payment status and webhooks

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payu_order_id TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_payu_order_id ON public.orders(payu_order_id);

-- Add comment
COMMENT ON COLUMN orders.payu_order_id IS 'PayU order ID (orderId) from PayU payment gateway';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'payu_order_id column added successfully!';
END $$;
