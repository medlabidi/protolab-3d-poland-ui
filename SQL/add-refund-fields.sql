-- Migration: Add refund-related fields to orders table
-- These fields store refund method, amount, reason, and bank details for credit/bank refunds

-- Add refund_method column (credit, bank, or original payment method)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_method TEXT CHECK (refund_method IN ('credit', 'bank', 'original'));

-- Add refund_amount column (stores the amount to be refunded)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);

-- Add refund_reason column (stores why the refund was requested)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add refund_bank_details column (stores bank account info as JSON for bank refunds)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_bank_details JSONB;

-- Create index for refund_method to optimize queries filtering by refund method
CREATE INDEX IF NOT EXISTS idx_orders_refund_method ON public.orders(refund_method);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Refund fields (refund_method, refund_amount, refund_reason, refund_bank_details) added to orders table successfully!';
END $$;

