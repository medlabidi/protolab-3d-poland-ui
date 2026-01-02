-- Add archive and soft delete columns to orders table
-- Run this in your Supabase SQL editor

-- Add is_archived column for archived orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add deleted_at column for soft delete functionality
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON public.orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);

-- Create composite index for common query pattern (user's active orders)
CREATE INDEX IF NOT EXISTS idx_orders_user_active ON public.orders(user_id, is_archived, deleted_at);

-- Optional: Add comment to columns for documentation
COMMENT ON COLUMN public.orders.is_archived IS 'Whether the order has been archived by the user';
COMMENT ON COLUMN public.orders.deleted_at IS 'Soft delete timestamp - NULL means not deleted';
