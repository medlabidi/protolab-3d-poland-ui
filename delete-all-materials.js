const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function deleteAllMaterials() {
  console.log('⚠️  WARNING: This will delete ALL materials from the database!');
  console.log('Starting deletion in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log('Deleting all materials...');
    
    const { error } = await supabase
      .from('materials')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (error) {
      console.error('❌ Error deleting materials:', error);
      process.exit(1);
    }
    
    console.log('✅ All materials deleted successfully!');
    
    // Verify deletion
    const { data, error: countError } = await supabase
      .from('materials')
      .select('id', { count: 'exact', head: true });
    
    if (!countError) {
      console.log('Remaining materials:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

deleteAllMaterials();
