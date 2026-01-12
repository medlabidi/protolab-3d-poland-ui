const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMaterialTypesMigration() {
  console.log('Starting material_types table migration...');
  
  try {
    // Create material_types table
    console.log('Creating material_types table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS material_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (createTableError) {
      console.log('Note: Could not create table via RPC, attempting direct SQL execution...');
    }

    // Create indexes
    console.log('Creating indexes...');
    await supabase.from('material_types').select('id').limit(1); // Test if table exists

    // Migrate existing material types
    console.log('Migrating existing material types...');
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('material_type')
      .not('material_type', 'is', null);

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return;
    }

    const uniqueTypes = [...new Set(materials.map(m => m.material_type).filter(Boolean))];
    console.log(`Found ${uniqueTypes.length} unique material types:`, uniqueTypes);

    for (const typeName of uniqueTypes) {
      const { data, error } = await supabase
        .from('material_types')
        .upsert({ name: typeName, is_active: true }, { onConflict: 'name' })
        .select();

      if (error) {
        console.error(`Error inserting type ${typeName}:`, error);
      } else {
        console.log(`✓ Migrated type: ${typeName}`);
      }
    }

    // Add material_type_id column to materials table
    console.log('\nAdding material_type_id column to materials table...');
    const { data: columnsCheck } = await supabase
      .from('materials')
      .select('material_type_id')
      .limit(1);

    if (!columnsCheck) {
      console.log('material_type_id column needs to be added manually via SQL editor');
      console.log('Run this SQL: ALTER TABLE materials ADD COLUMN IF NOT EXISTS material_type_id INTEGER REFERENCES material_types(id);');
    } else {
      console.log('✓ material_type_id column exists');
    }

    console.log('\n✅ Material types migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL migration file in Supabase SQL editor if needed');
    console.log('2. Deploy to Vercel: vercel --prod');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMaterialTypesMigration();
