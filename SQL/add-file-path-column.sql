-- Add file_path column to orders table for storing the Supabase Storage path
-- This enables generating signed URLs for private bucket access

ALTER TABLE orders ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Update existing orders to extract file_path from file_url (optional)
-- This assumes file_url follows the pattern: .../bucket-name/path/to/file
-- You may need to adjust this based on your actual URL format

-- For existing orders, you can manually update or leave file_path NULL
-- New orders will automatically have file_path populated

COMMENT ON COLUMN orders.file_path IS 'Storage path within the print-jobs bucket for generating signed URLs';
