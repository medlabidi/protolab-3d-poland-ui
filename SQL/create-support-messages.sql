-- Migration: Create support_messages table
-- This table is used for general support messages (not tied to orders)

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_response TEXT,
  admin_id UUID REFERENCES public.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own support messages
CREATE POLICY "Users can view own support messages" ON public.support_messages
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create support messages
CREATE POLICY "Users can create support messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Service role has full access
CREATE POLICY "Service role has full access to support messages" ON public.support_messages
  USING (auth.jwt()->>'role' = 'service_role');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'support_messages table created successfully!';
END $$;
