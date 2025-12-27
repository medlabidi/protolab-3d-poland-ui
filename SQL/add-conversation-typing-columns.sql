-- Add typing indicator columns to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS user_read BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS admin_read BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS user_typing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_typing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_typing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_typing_at TIMESTAMPTZ;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_read ON public.conversations(user_read);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_read ON public.conversations(admin_read);
CREATE INDEX IF NOT EXISTS idx_conversations_user_typing ON public.conversations(user_typing);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_typing ON public.conversations(admin_typing);

-- Comments
COMMENT ON COLUMN public.conversations.user_read IS 'Indicates if the user has read the latest messages from admin';
COMMENT ON COLUMN public.conversations.admin_read IS 'Indicates if the admin has read the latest messages from user';
COMMENT ON COLUMN public.conversations.user_typing IS 'Indicates if the user is currently typing';
COMMENT ON COLUMN public.conversations.user_typing_at IS 'Timestamp when user started typing';
COMMENT ON COLUMN public.conversations.admin_typing IS 'Indicates if the admin is currently typing';
COMMENT ON COLUMN public.conversations.admin_typing_at IS 'Timestamp when admin started typing';
