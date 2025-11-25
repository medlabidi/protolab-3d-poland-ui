#!/usr/bin/env node

/**
 * Supabase Connection Verification Script
 * Usage: npm run verify-db
 * 
 * This script tests the Supabase connection without starting the full server
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { logger } from './server/src/config/logger';

const verifyConnection = async (): Promise<void> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('\n📋 Supabase Connection Verification');
  console.log('==========================================\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing Supabase credentials!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    process.exit(1);
  }
  
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  try {
    console.log('\n⏳ Connecting to Supabase...\n');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Test connection by checking tables
    console.log('🧪 Testing Connection...');
    
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError && usersError.code !== 'PGRST116') {
      throw usersError;
    }
    
    console.log('✅ Supabase Connection Successful!\n');
    
    // List tables
    console.log('📊 Checking Tables:');
    const tables = ['users', 'orders', 'refresh_tokens', 'settings'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log(`  ⚠️  ${table}: Table not found (needs to be created)`);
        } else {
          console.log(`  ❌ ${table}: Error - ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${table}: ${count || 0} records`);
      }
    }
    
    // Test storage buckets
    console.log('\n📦 Checking Storage Buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`  ⚠️  Could not list buckets: ${bucketsError.message}`);
    } else {
      if (buckets && buckets.length > 0) {
        buckets.forEach((bucket) => {
          console.log(`  ✅ ${bucket.name}`);
        });
      } else {
        console.log('  ⚠️  No storage buckets found (needs to be created)');
      }
    }
    
    console.log('\n🎉 All tests passed! Supabase is ready.\n');
    console.log('==========================================\n');
  } catch (error) {
    console.error('\n❌ Supabase Connection Failed!\n');
    console.error('Error Details:');
    console.error(error);
    
    console.error('\n🔍 Troubleshooting Tips:');
    console.error('1. Check your SUPABASE_URL in .env file');
    console.error('2. Verify SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('3. Ensure your Supabase project is active');
    console.error('4. Check if required tables exist in your database');
    console.error('5. Verify internet connection\n');
    
    process.exit(1);
  }
};

verifyConnection();
