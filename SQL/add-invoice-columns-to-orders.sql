-- Add invoice/factura related columns to orders table
-- This tracks whether customer requested invoice and stores business info for that order

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_business_info JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.invoice_required IS 'Whether customer requested invoice (faktura) for this order';
COMMENT ON COLUMN orders.invoice_business_info IS 'Business information used for invoice generation (snapshot from payment time)';
COMMENT ON COLUMN orders.invoice_generated_at IS 'Timestamp when invoice PDF was generated';
COMMENT ON COLUMN orders.invoice_pdf_url IS 'URL/path to generated invoice PDF file';

-- Example invoice_business_info structure:
-- {
--   "company_name": "Example Sp. z o.o.",
--   "nip": "1234567890",
--   "address": "ul. Przykładowa 10",
--   "city": "Kraków",
--   "postal_code": "30-001"
-- }
