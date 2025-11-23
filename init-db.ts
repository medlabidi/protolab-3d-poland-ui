#!/usr/bin/env node

/**
 * Initialize Supabase Database with Default Data
 * Usage: npm run init-db
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function initializeDatabase() {
  console.log('\n🔧 Initializing Supabase Database...\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (!existingSettings) {
      console.log('📝 Creating default settings...');
      
      const { data: newSettings, error: insertError } = await supabase
        .from('settings')
        .insert([{
          material_rate: 0.05,
          time_rate: 10,
          service_fee: 5,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Default settings created:');
      console.log(`   Material Rate: ${newSettings.material_rate}`);
      console.log(`   Time Rate: ${newSettings.time_rate}`);
      console.log(`   Service Fee: ${newSettings.service_fee}\n`);
    } else {
      console.log('✅ Settings already exist:');
      console.log(`   Material Rate: ${existingSettings.material_rate}`);
      console.log(`   Time Rate: ${existingSettings.time_rate}`);
      console.log(`   Service Fee: ${existingSettings.service_fee}\n`);
    }

    // Verify all tables
    console.log('📊 Database Status:');
    const tables = ['users', 'orders', 'refresh_tokens', 'settings'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} records`);
      }
    }

    console.log('\n🎉 Database initialized successfully!\n');
  } catch (error) {
    console.error('\n❌ Database initialization failed!');
    console.error(error);
    process.exit(1);
  }
}

initializeDatabase();
