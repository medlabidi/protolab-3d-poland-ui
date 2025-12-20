-- Combined Migration Script for Refund and Notification Features
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PART 1: Add refund-related fields to orders table
-- =====================================================

-- Add refund_method column (credit, bank, or original payment method)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_method TEXT;

-- Add constraint for refund_method after column creation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_refund_method_check'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_refund_method_check 
    CHECK (refund_method IN ('credit', 'bank', 'original'));
  END IF;
END $$;

-- Add refund_reason column (stores why the refund was requested)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add refund_bank_details column (stores bank account info as JSON for bank refunds)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_bank_details JSONB;

-- Create index for refund_method to optimize queries filtering by refund method
CREATE INDEX IF NOT EXISTS idx_orders_refund_method ON public.orders(refund_method);

-- =====================================================
-- PART 2: Create notifications table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_status_change', 'refund_processed', 'order_approved', 'order_rejected', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Service role can insert notifications (for backend operations)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- Success Messages
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Refund fields added to orders table successfully!';
  RAISE NOTICE '✅ Notifications table created successfully!';
  RAISE NOTICE '✅ All migrations completed!';
END $$;
