const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addDefaultColumn() {
  console.log('🔧 Adding is_default column to printers table...\n');
  
  try {
    // Note: This requires direct database access via Supabase SQL Editor
    // Run this SQL in your Supabase dashboard:
    
    const sqlCommands = `
-- Add is_default column to printers table
ALTER TABLE printers ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for is_default
CREATE INDEX IF NOT EXISTS idx_printers_default ON printers(is_default);

-- Set the first operational printer as default if none exists
UPDATE printers 
SET is_default = true 
WHERE id = (
  SELECT id FROM printers 
  WHERE status = 'operational' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM printers WHERE is_default = true);
`;

    console.log('📝 Please run the following SQL commands in your Supabase SQL Editor:\n');
    console.log(sqlCommands);
    console.log('\n✅ Migration script prepared!');
    console.log('   Go to: Supabase Dashboard → SQL Editor → New Query');
    console.log('   Copy and paste the SQL above');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addDefaultColumn();
