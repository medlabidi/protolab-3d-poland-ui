const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Running migration...');
    
    // Add shipping_address column
    const { error: addColumnError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT' 
      });
    
    if (addColumnError && !addColumnError.message.includes('already exists')) {
      console.error('Error adding column:', addColumnError);
    } else {
      console.log('✓ Added shipping_address column');
    }
    
    // Drop old constraint
    const { error: dropError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_method_check' 
      });
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError);
    } else {
      console.log('✓ Dropped old shipping_method constraint');
    }
    
    // Add new constraint with dpd
    const { error: addConstraintError } = await supabase
      .rpc('exec_sql', { 
        sql_query: "ALTER TABLE public.orders ADD CONSTRAINT orders_shipping_method_check CHECK (shipping_method IN ('pickup', 'inpost', 'dpd', 'courier'))" 
      });
    
    if (addConstraintError && !addConstraintError.message.includes('already exists')) {
      console.error('Error adding constraint:', addConstraintError);
    } else {
      console.log('✓ Added new shipping_method constraint with dpd');
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
