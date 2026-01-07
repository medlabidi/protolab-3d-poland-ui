-- Add phone column to users table for complete buyer information
-- This allows storing user's phone number in their profile

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.phone IS 'User phone number in international format (e.g., +48123456789)';

-- Note: Phone can also come from shipping_address in orders table
-- Priority: users.phone → shipping_address.phone → empty string
