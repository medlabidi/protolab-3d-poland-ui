-- Add approval workflow columns to users table
-- Run this in Supabase SQL Editor

-- Add status column with default 'pending'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approval token for admin approval links
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_token TEXT;

-- Add timestamp when user was approved
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add reference to who approved the user (admin ID or email)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- Create index for faster approval token lookups
CREATE INDEX IF NOT EXISTS idx_users_approval_token ON users(approval_token);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to 'approved' status (if any exist)
-- This ensures existing users can still login after migration
UPDATE users 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

-- Add comment to table
COMMENT ON COLUMN users.status IS 'User account status: pending (awaiting admin approval), approved (can login), rejected (denied access)';
COMMENT ON COLUMN users.approval_token IS 'Unique token used in admin approval/rejection email links';
COMMENT ON COLUMN users.approved_at IS 'Timestamp when the user account was approved';
COMMENT ON COLUMN users.approved_by IS 'Admin identifier who approved the account';

-- Display confirmation
SELECT 'Approval workflow columns added successfully!' AS message;
