-- Add user_read column to track if user has seen the latest messages
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS user_read BOOLEAN DEFAULT TRUE;

-- Set existing conversations to true (assume already read)
UPDATE public.conversations
SET user_read = TRUE
WHERE user_read IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_read ON public.conversations(user_read);

-- Comment
COMMENT ON COLUMN public.conversations.user_read IS 'Indicates if the user has read the latest messages from admin';
