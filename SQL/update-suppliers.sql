-- Add supplier column to materials table if it doesn't exist
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);

-- Set default supplier for all existing materials
UPDATE materials
SET supplier = 'Prusament'
WHERE supplier IS NULL;

