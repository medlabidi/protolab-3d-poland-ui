-- ProtoLab 3D Poland - Services Tables Migration
-- Run this in your Supabase SQL Editor to create tables for design requests and appointments

-- Create design_requests table
CREATE TABLE IF NOT EXISTS public.design_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  project_description TEXT NOT NULL,
  reference_files JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'in_progress', 'completed', 'cancelled')),
  admin_notes TEXT,
  estimated_completion_date DATE,
  final_files JSONB DEFAULT '[]'::jsonb,
  price DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  topic TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  admin_notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_design_requests_user_id ON public.design_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_status ON public.design_requests(status);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at ON public.design_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_requests_email ON public.design_requests(email);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(email);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_requests table
-- Users can view their own design requests
CREATE POLICY "Users can view own design requests" ON public.design_requests
  FOR SELECT USING (
    auth.uid()::text = user_id::text 
    OR email = (SELECT email FROM public.users WHERE id::text = auth.uid()::text)
  );

-- Users can insert their own design requests
CREATE POLICY "Users can create design requests" ON public.design_requests
  FOR INSERT WITH CHECK (true);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role has full access to design requests" ON public.design_requests
  USING (true);

-- RLS Policies for appointments table
-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid()::text = user_id::text 
    OR email = (SELECT email FROM public.users WHERE id::text = auth.uid()::text)
  );

-- Users can insert their own appointments
CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role has full access to appointments" ON public.appointments
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_design_requests_updated_at BEFORE UPDATE ON public.design_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
