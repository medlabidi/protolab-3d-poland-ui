-- Migration: Update payment_status constraint to include pending, failed, and cancelled
-- These statuses are used throughout the payment lifecycle:
-- - pending: Order created, awaiting payment initiation
-- - failed: Payment attempt failed
-- - cancelled: Payment/order was cancelled by user or system

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('paid', 'pending', 'on_hold', 'refunding', 'refunded', 'failed', 'cancelled'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'payment_status constraint updated successfully! Added: pending, failed, cancelled';
END $$;
