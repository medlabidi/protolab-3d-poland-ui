-- Add email verification columns to users table
-- Run this in Supabase SQL Editor

-- Add verification_token column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Add verification_token_expires column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Add status column if it doesn't exist (for approval workflow)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approval_token column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_token TEXT;

-- Add approved_at column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Update existing users to have status = 'approved' and email_verified = true
UPDATE users 
SET status = 'approved', 
    email_verified = true 
WHERE status IS NULL OR email_verified IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_approval_token ON users(approval_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Display the updated schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
