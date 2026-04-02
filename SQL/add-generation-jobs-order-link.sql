-- Create generation_jobs table with order/conversation links
-- Run this ONCE in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    style TEXT,
    face_limit INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tripo_task_id TEXT,
    file_url TEXT,
    file_name TEXT,
    error_message TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_order_id ON public.generation_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_conversation_id ON public.generation_jobs(conversation_id);

-- Enable RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own generation jobs
CREATE POLICY "Users can view own generation jobs" ON public.generation_jobs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (used by the API)
CREATE POLICY "Service role full access" ON public.generation_jobs
    FOR ALL USING (true) WITH CHECK (true);
