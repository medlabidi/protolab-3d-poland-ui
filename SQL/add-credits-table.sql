-- Create credits table for user store credits
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credits_transactions table to track all credit changes
CREATE TABLE IF NOT EXISTS public.credits_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'refund_bonus', 'order_payment', 'admin_adjustment'
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON public.credits_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_created_at ON public.credits_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for credits
CREATE POLICY "Users can view their own credits" ON public.credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON public.credits
    FOR ALL USING (true);

-- RLS policies for credits_transactions
CREATE POLICY "Users can view their own transactions" ON public.credits_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions" ON public.credits_transactions
    FOR ALL USING (true);

-- Function to update credits balance and log transaction
CREATE OR REPLACE FUNCTION update_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp on credits table
    UPDATE public.credits 
    SET updated_at = NOW() 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on new transaction
CREATE TRIGGER on_credits_transaction_insert
    AFTER INSERT ON public.credits_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_balance();
