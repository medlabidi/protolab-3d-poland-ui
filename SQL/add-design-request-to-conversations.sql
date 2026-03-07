-- Add design_request_id column to conversations table
-- This allows conversations to be linked to either orders OR design requests

-- First, make order_id nullable since we'll have conversations with design_request_id instead
ALTER TABLE public.conversations 
  ALTER COLUMN order_id DROP NOT NULL;

-- Add design_request_id column
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS design_request_id UUID REFERENCES public.design_requests(id) ON DELETE CASCADE;

-- Create index for design_request_id
CREATE INDEX IF NOT EXISTS idx_conversations_design_request_id 
  ON public.conversations(design_request_id);

-- Add check constraint to ensure either order_id OR design_request_id is set (not both, not neither)
ALTER TABLE public.conversations 
  ADD CONSTRAINT chk_conversation_reference 
  CHECK (
    (order_id IS NOT NULL AND design_request_id IS NULL) OR 
    (order_id IS NULL AND design_request_id IS NOT NULL)
  );

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name IN ('order_id', 'design_request_id');

COMMENT ON COLUMN public.conversations.design_request_id IS 'Links conversation to a design assistance request';
COMMENT ON CONSTRAINT chk_conversation_reference ON public.conversations IS 'Ensures conversation is linked to exactly one of: order or design_request';
