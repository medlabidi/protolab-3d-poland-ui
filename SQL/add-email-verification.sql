-- Add email verification fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index for verification token
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token);

-- Update existing users to have email verified as true (optional migration step)
-- UPDATE public.users SET email_verified = TRUE WHERE email_verified IS NULL;
