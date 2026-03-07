-- Verify and create design_requests table structure
-- This matches the backend code expectations

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'design_requests') THEN
        RAISE NOTICE 'Table design_requests already exists';
        
        -- Show current structure
        RAISE NOTICE 'Current columns:';
    ELSE
        RAISE NOTICE 'Table design_requests does NOT exist - will create it';
    END IF;
END $$;

-- Show existing columns if table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'design_requests'
ORDER BY ordinal_position;

-- Create the table with correct structure if it doesn't exist
CREATE TABLE IF NOT EXISTS public.design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Request information
  project_name TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  
  -- Usage information
  usage_type VARCHAR(50) CHECK (usage_type IN ('mechanical', 'decorative', 'functional', 'prototype', 'other')),
  usage_details TEXT,
  
  -- Specifications
  approximate_dimensions VARCHAR(100),
  desired_material VARCHAR(50),
  
  -- Reference files
  attached_files JSONB DEFAULT '[]'::jsonb,
  reference_images JSONB DEFAULT '[]'::jsonb,
  
  -- Communication
  request_chat BOOLEAN DEFAULT FALSE,
  
  -- Admin work
  design_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (design_status IN ('pending', 'in_review', 'in_progress', 'completed', 'cancelled')),
  admin_design_file TEXT,
  admin_notes TEXT,
  
  -- Pricing
  estimated_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'on_hold', 'refunded')),
  
  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_design_requests_user_id ON public.design_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_design_status ON public.design_requests(design_status);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at ON public.design_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_requests_payment_status ON public.design_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_design_requests_archived ON public.design_requests(is_archived) WHERE is_archived = FALSE;

-- Enable RLS
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own design requests
DROP POLICY IF EXISTS "Users can view their own design requests" ON public.design_requests;
CREATE POLICY "Users can view their own design requests" 
  ON public.design_requests FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own design requests
DROP POLICY IF EXISTS "Users can create design requests" ON public.design_requests;
CREATE POLICY "Users can create design requests" 
  ON public.design_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own design requests (limited fields)
DROP POLICY IF EXISTS "Users can update their own design requests" ON public.design_requests;
CREATE POLICY "Users can update their own design requests" 
  ON public.design_requests FOR UPDATE 
  USING (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role has full access to design requests" ON public.design_requests;
CREATE POLICY "Service role has full access to design requests" 
  ON public.design_requests 
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_design_requests_updated_at ON public.design_requests;
CREATE TRIGGER update_design_requests_updated_at 
  BEFORE UPDATE ON public.design_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT 
  'design_requests' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'design_requests';

-- Show sample data if exists
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN design_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN design_status = 'in_review' THEN 1 END) as in_review,
  COUNT(CASE WHEN design_status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN design_status = 'completed' THEN 1 END) as completed
FROM public.design_requests;

COMMENT ON TABLE public.design_requests IS 'Stores design assistance requests from users';
