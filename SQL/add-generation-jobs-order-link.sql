-- Add order_id and conversation_id columns to generation_jobs table
-- Links generation jobs to design orders and conversations

ALTER TABLE public.generation_jobs
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.generation_jobs
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Index for looking up generation jobs by order
CREATE INDEX IF NOT EXISTS idx_generation_jobs_order_id ON public.generation_jobs(order_id);

-- Index for looking up generation jobs by conversation
CREATE INDEX IF NOT EXISTS idx_generation_jobs_conversation_id ON public.generation_jobs(conversation_id);
