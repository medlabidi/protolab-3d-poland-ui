-- Migration: Split name into firstName and lastName fields
-- This provides better structure for user data and integrations like PayU

-- Add new columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data: split name into firstName and lastName
UPDATE public.users
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND name LIKE '% %' THEN split_part(name, ' ', 1)
    WHEN name IS NOT NULL THEN name
    ELSE NULL
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND name LIKE '% %' THEN substring(name from position(' ' in name) + 1)
    WHEN name IS NOT NULL THEN name
    ELSE NULL
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Add comments
COMMENT ON COLUMN users.first_name IS 'User first name (imię)';
COMMENT ON COLUMN users.last_name IS 'User last name (nazwisko)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'firstName and lastName columns added successfully! Existing names have been split.';
END $$;
