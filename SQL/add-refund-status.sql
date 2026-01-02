-- Migration: Add refund_requested status to orders
-- This status is used when a customer requests a refund

-- Add 'refund_requested' to the status check constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('submitted', 'in_queue', 'printing', 'finished', 'delivered', 'on_hold', 'suspended', 'refund_requested'));

-- Add 'refund_requested' to the payment_status check constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('paid', 'on_hold', 'refunding', 'refunded'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'refund_requested status added to orders table successfully!';
END $$;
