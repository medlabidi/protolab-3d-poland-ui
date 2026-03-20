-- Add AI agent status tracking to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) DEFAULT 'active';
-- Values: 'active' (AI is responding), 'escalated' (handed off to human admin), 'disabled' (AI not activated)

COMMENT ON COLUMN public.conversations.ai_status IS 'Tracks whether AI agent is active, escalated to admin, or disabled';
