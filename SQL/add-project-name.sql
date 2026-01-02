-- Migration: Add project_name column to orders table
-- This column is used to group multiple files into a single project

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Create index for faster project grouping queries
CREATE INDEX IF NOT EXISTS idx_orders_project_name ON public.orders(project_name);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'project_name column added to orders table successfully!';
END $$;
