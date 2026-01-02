-- Add payment_method column to orders table to track payment type
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';

-- Add comment to document the field
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used: card, blik, credits, bank_transfer';

-- Create index for faster payment method queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
