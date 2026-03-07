-- Add design approval system to design_requests table
-- This allows users to approve or reject the design provided by admin

-- Add approval columns
ALTER TABLE public.design_requests 
  ADD COLUMN IF NOT EXISTS user_approval_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (user_approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.design_requests 
  ADD COLUMN IF NOT EXISTS user_approval_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.design_requests 
  ADD COLUMN IF NOT EXISTS user_rejection_reason TEXT;

-- Add index for approval status
CREATE INDEX IF NOT EXISTS idx_design_requests_approval 
  ON public.design_requests(user_approval_status);

-- Comments for documentation
COMMENT ON COLUMN public.design_requests.user_approval_status IS 'User approval status for admin design: pending, approved, rejected';
COMMENT ON COLUMN public.design_requests.user_approval_at IS 'Timestamp when user approved or rejected the design';
COMMENT ON COLUMN public.design_requests.user_rejection_reason IS 'Reason provided by user when rejecting the design';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'design_requests'
    AND column_name IN ('user_approval_status', 'user_approval_at', 'user_rejection_reason');
