-- ============================================
-- ProtoLab - Separate Print Jobs and Design Assistance Tables
-- Date: 2026-01-11
-- Description: Creates separate tables for print_jobs and design_requests
-- ============================================

BEGIN;

-- ============================================
-- PART 0: Clean up existing tables if needed
-- ============================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS all_orders CASCADE;

-- Drop existing tables and their constraints
DROP TABLE IF EXISTS public.print_jobs CASCADE;
DROP TABLE IF EXISTS public.design_requests CASCADE;

-- ============================================
-- PART 1: Create print_jobs table
-- ============================================

CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- File information
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT NOT NULL,
  
  -- Print specifications
  material VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  layer_height NUMERIC(5,2) NOT NULL,
  infill INTEGER NOT NULL CHECK (infill >= 0 AND infill <= 100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  
  -- Calculated values
  material_weight NUMERIC(10,2),
  print_time NUMERIC(10,2),
  
  -- Pricing
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'on_hold', 'refunding', 'refunded')),
  
  -- Order status
  status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_queue', 'printing', 'finished', 'delivered', 'on_hold', 'suspended')),
  
  -- Shipping
  shipping_method VARCHAR(50) NOT NULL CHECK (shipping_method IN ('pickup', 'inpost', 'dpd', 'courier')),
  shipping_address TEXT,
  tracking_code VARCHAR(100),
  
  -- Optional fields
  project_name TEXT,
  review TEXT,
  
  -- Relationship (if created from design request) - constraint added later
  parent_design_request_id UUID,
  
  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 2: Create design_requests table
-- ============================================

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

-- ============================================
-- PART 3: Create indices for print_jobs
-- ============================================

CREATE INDEX IF NOT EXISTS idx_print_jobs_user_id ON public.print_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON public.print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON public.print_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_jobs_payment_status ON public.print_jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_parent_design ON public.print_jobs(parent_design_request_id) WHERE parent_design_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_print_jobs_archived ON public.print_jobs(is_archived) WHERE is_archived = FALSE;

-- ============================================
-- PART 4: Create indices for design_requests
-- ============================================

CREATE INDEX IF NOT EXISTS idx_design_requests_user_id ON public.design_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_status ON public.design_requests(design_status);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at ON public.design_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_requests_chat ON public.design_requests(request_chat) WHERE request_chat = TRUE;
CREATE INDEX IF NOT EXISTS idx_design_requests_payment ON public.design_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_design_requests_archived ON public.design_requests(is_archived) WHERE is_archived = FALSE;

-- ============================================
-- PART 5: Add comments for documentation
-- ============================================

COMMENT ON TABLE public.print_jobs IS '3D printing job orders';
COMMENT ON TABLE public.design_requests IS 'Design assistance requests where customers need help creating 3D models';

COMMENT ON COLUMN print_jobs.parent_design_request_id IS 'Links this print job to a design request if it was created from one';
COMMENT ON COLUMN design_requests.design_status IS 'Design workflow status: pending, in_review, in_progress, completed, cancelled';
COMMENT ON COLUMN design_requests.usage_type IS 'Intended use: mechanical, decorative, functional, prototype, other';
COMMENT ON COLUMN design_requests.request_chat IS 'TRUE if customer wants to chat with admin about the design';

-- ============================================
-- PART 6: Enable RLS (Row Level Security)
-- ============================================

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Users can create print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Service role has full access to print jobs" ON public.print_jobs;

DROP POLICY IF EXISTS "Users can view own design requests" ON public.design_requests;
DROP POLICY IF EXISTS "Users can create design requests" ON public.design_requests;
DROP POLICY IF EXISTS "Service role has full access to design requests" ON public.design_requests;

-- Print jobs policies
CREATE POLICY "Users can view own print jobs" ON public.print_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create print jobs" ON public.print_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to print jobs" ON public.print_jobs
    USING (true);

-- Design requests policies
CREATE POLICY "Users can view own design requests" ON public.design_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create design requests" ON public.design_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to design requests" ON public.design_requests
    USING (true);

-- ============================================
-- PART 7: Create triggers for updated_at
-- ============================================

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to print_jobs
DROP TRIGGER IF EXISTS update_print_jobs_updated_at ON public.print_jobs;
CREATE TRIGGER update_print_jobs_updated_at
    BEFORE UPDATE ON public.print_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to design_requests
DROP TRIGGER IF EXISTS update_design_requests_updated_at ON public.design_requests;
CREATE TRIGGER update_design_requests_updated_at
    BEFORE UPDATE ON public.design_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 7b: Add foreign key constraint now that both tables exist
-- ============================================

ALTER TABLE public.print_jobs
ADD CONSTRAINT fk_print_jobs_parent_design_request
FOREIGN KEY (parent_design_request_id) 
REFERENCES public.design_requests(id) 
ON DELETE SET NULL;

-- ============================================
-- PART 8: Migrate existing data from orders table
-- ============================================

-- Migrate print jobs (only from print type orders)
INSERT INTO public.print_jobs (
    id, user_id, file_url, file_name,
    material, color, layer_height, infill, quantity,
    price, status, shipping_method,
    created_at
)
SELECT 
    id, user_id, file_url, file_name,
    material, color, layer_height, infill, quantity,
    price, status, shipping_method,
    created_at
FROM public.orders
WHERE order_type = 'print' OR order_type IS NULL
ON CONFLICT (id) DO NOTHING;

-- Migrate design requests (only from design type orders)
-- Note: Creating minimal records, admin can fill in details later
INSERT INTO public.design_requests (
    id, user_id, project_name, idea_description,
    design_status,
    estimated_price,
    created_at
)
SELECT 
    id, user_id, 
    COALESCE(project_name, file_name, 'Design Request'),
    COALESCE(file_name, 'Design assistance request'),
    'pending',
    price,
    created_at
FROM public.orders
WHERE order_type = 'design'
ON CONFLICT (id) DO NOTHING;

-- Note: parent_order_id relationship will be set up manually if needed

-- ============================================
-- PART 9: Create unified view for compatibility
-- ============================================

CREATE OR REPLACE VIEW all_orders AS
SELECT 
    id,
    user_id,
    'print' as order_type,
    file_name as name,
    project_name,
    status,
    payment_status,
    price,
    paid_amount,
    created_at,
    updated_at,
    NULL as design_status,
    is_archived
FROM public.print_jobs
UNION ALL
SELECT 
    id,
    user_id,
    'design' as order_type,
    project_name as name,
    project_name,
    design_status as status,
    payment_status,
    COALESCE(final_price, estimated_price, 0) as price,
    paid_amount,
    created_at,
    updated_at,
    design_status,
    is_archived
FROM public.design_requests;

COMMENT ON VIEW all_orders IS 'Unified view of print jobs and design requests for compatibility';

-- ============================================
-- PART 10: Verification and statistics
-- ============================================

DO $$ 
DECLARE
    print_count INTEGER;
    design_count INTEGER;
    total_count INTEGER;
    old_table_count INTEGER;
BEGIN
    -- Count in new tables
    SELECT COUNT(*) INTO print_count FROM print_jobs;
    SELECT COUNT(*) INTO design_count FROM design_requests;
    total_count := print_count + design_count;
    
    -- Count in old table
    SELECT COUNT(*) INTO old_table_count FROM orders;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Data Migration Summary:';
    RAISE NOTICE '  Old orders table: % records', old_table_count;
    RAISE NOTICE '  New print_jobs table: % records', print_count;
    RAISE NOTICE '  New design_requests table: % records', design_count;
    RAISE NOTICE '  Total migrated: % records', total_count;
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '  ✓ print_jobs (3D printing orders)';
    RAISE NOTICE '  ✓ design_requests (design assistance)';
    RAISE NOTICE '';
    RAISE NOTICE 'Indices Created:';
    RAISE NOTICE '  ✓ 6 indices on print_jobs';
    RAISE NOTICE '  ✓ 6 indices on design_requests';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  ✓ all_orders (unified view)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✓ Row Level Security (RLS) enabled';
    RAISE NOTICE '  ✓ Auto-update timestamps';
    RAISE NOTICE '  ✓ Foreign key relationships';
    RAISE NOTICE '  ✓ Data validation constraints';
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'IMPORTANT: Update your application code';
    RAISE NOTICE 'to use the new tables!';
    RAISE NOTICE '====================================';
END $$;

COMMIT;

-- ============================================
-- PART 11: Optional - Archive old orders table
-- ============================================

-- Uncomment these lines after verifying the migration works:
-- ALTER TABLE public.orders RENAME TO orders_old_backup;
-- COMMENT ON TABLE public.orders_old_backup IS 'Backup of orders table before split into print_jobs and design_requests (2026-01-11)';
