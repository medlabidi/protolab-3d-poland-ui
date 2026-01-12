/**
 * Seed Materials Database
 * This script populates the materials table with all available materials
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// For CommonJS compatibility
const __dirname = path.resolve();

// Load environment variables from server/.env
config({ path: path.resolve(__dirname, 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Material data matching what users see in NewPrint.tsx
const materials = [
  // PLA Materials
  { material_type: 'PLA', color: 'White', price_per_kg: 39, stock_status: 'available', lead_time_days: 0, hex_color: '#FFFFFF' },
  { material_type: 'PLA', color: 'Black', price_per_kg: 39, stock_status: 'available', lead_time_days: 0, hex_color: '#000000' },
  { material_type: 'PLA', color: 'Red', price_per_kg: 49, stock_status: 'available', lead_time_days: 0, hex_color: '#FF0000' },
  { material_type: 'PLA', color: 'Yellow', price_per_kg: 49, stock_status: 'out_of_stock', lead_time_days: 2, hex_color: '#FFFF00' },
  { material_type: 'PLA', color: 'Blue', price_per_kg: 49, stock_status: 'available', lead_time_days: 0, hex_color: '#0000FF' },
  
  // ABS Materials
  { material_type: 'ABS', color: 'Silver', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#C0C0C0' },
  { material_type: 'ABS', color: 'Transparent', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#F0F0F0' },
  { material_type: 'ABS', color: 'Black', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#000000' },
  { material_type: 'ABS', color: 'Grey', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#808080' },
  { material_type: 'ABS', color: 'Red', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#FF0000' },
  { material_type: 'ABS', color: 'White', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#FFFFFF' },
  { material_type: 'ABS', color: 'Blue', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#0000FF' },
  { material_type: 'ABS', color: 'Green', price_per_kg: 50, stock_status: 'out_of_stock', lead_time_days: 2, hex_color: '#00FF00' },
  
  // PETG Materials
  { material_type: 'PETG', color: 'Black', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#000000' },
  { material_type: 'PETG', color: 'White', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#FFFFFF' },
  { material_type: 'PETG', color: 'Red', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#FF0000' },
  { material_type: 'PETG', color: 'Green', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#00FF00' },
  { material_type: 'PETG', color: 'Blue', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#0000FF' },
  { material_type: 'PETG', color: 'Yellow', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#FFFF00' },
  { material_type: 'PETG', color: 'Pink', price_per_kg: 50, stock_status: 'out_of_stock', lead_time_days: 2, hex_color: '#FFC0CB' },
  { material_type: 'PETG', color: 'Orange', price_per_kg: 50, stock_status: 'out_of_stock', lead_time_days: 2, hex_color: '#FFA500' },
  { material_type: 'PETG', color: 'Silver', price_per_kg: 50, stock_status: 'available', lead_time_days: 0, hex_color: '#C0C0C0' },
];

async function seedMaterials() {
  console.log('🌱 Starting materials seeding...\n');

  try {
    // Check if materials table exists and has data
    const { data: existingMaterials, error: checkError } = await supabase
      .from('materials')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking materials table:', checkError.message);
      process.exit(1);
    }

    if (existingMaterials && existingMaterials.length > 0) {
      console.log('⚠️  Materials table already has data.');
      console.log('   Do you want to clear existing materials and reseed? (This will delete all existing materials)');
      console.log('   Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Clear existing materials
      const { error: deleteError } = await supabase
        .from('materials')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('❌ Error clearing materials:', deleteError.message);
        process.exit(1);
      }
      
      console.log('✓ Existing materials cleared\n');
    }

    // Insert materials
    console.log(`📦 Inserting ${materials.length} materials...\n`);

    for (const material of materials) {
      const materialData = {
        ...material,
        is_active: true,
        description: `${material.material_type} ${material.color} - High quality 3D printing filament`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('materials')
        .insert(materialData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting ${material.material_type} ${material.color}:`, error.message);
      } else {
        const stockIcon = material.stock_status === 'available' ? '✓' : '⚠️';
        console.log(`${stockIcon} Added: ${material.material_type} - ${material.color} (${material.price_per_kg} PLN/kg)`);
      }
    }

    console.log('\n✅ Materials seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total materials: ${materials.length}`);
    console.log(`   Available: ${materials.filter(m => m.stock_status === 'available').length}`);
    console.log(`   Out of stock: ${materials.filter(m => m.stock_status === 'out_of_stock').length}`);

  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
    process.exit(1);
  }
}

seedMaterials();
