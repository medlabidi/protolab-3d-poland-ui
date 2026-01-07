-- Add business information column to users table for invoice/factura support
-- This stores company name, NIP (tax ID), and address for business customers

ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.business_info IS 'Business information for invoice generation (company_name, nip, address, city, postal_code)';

-- Example structure:
-- {
--   "company_name": "Example Sp. z o.o.",
--   "nip": "1234567890",
--   "address": "ul. Przykładowa 10",
--   "city": "Kraków",
--   "postal_code": "30-001"
-- }
