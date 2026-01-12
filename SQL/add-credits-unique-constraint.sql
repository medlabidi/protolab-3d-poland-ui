-- Add unique constraint on user_id for credits table
-- This allows upsert operations to work properly

ALTER TABLE public.credits 
ADD CONSTRAINT credits_user_id_unique UNIQUE (user_id);

-- Verify the constraint was added
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.credits'::regclass
  AND conname = 'credits_user_id_unique';
