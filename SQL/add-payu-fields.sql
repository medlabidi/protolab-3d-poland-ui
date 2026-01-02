-- Add PayU integration fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payu_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create index for faster PayU order lookups
CREATE INDEX IF NOT EXISTS idx_orders_payu_order_id ON public.orders(payu_order_id);

-- Add PayU transaction ID to credits_transactions table
ALTER TABLE public.credits_transactions
ADD COLUMN IF NOT EXISTS payu_order_id TEXT;

-- Create index for credits transactions PayU lookups
CREATE INDEX IF NOT EXISTS idx_credits_transactions_payu_order_id ON public.credits_transactions(payu_order_id);

-- Add comment to document the fields
COMMENT ON COLUMN public.orders.payu_order_id IS 'PayU order ID returned from payment gateway';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, completed, failed, canceled';
COMMENT ON COLUMN public.credits_transactions.payu_order_id IS 'PayU order ID for credit purchase transactions';
