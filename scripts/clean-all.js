#!/usr/bin/env node

/**
 * Quick Database & Storage Cleanup
 * This script cleans both database and storage in one go
 */

const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const readline = require('readline');

// Load environment variables
config({ path: path.resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to clean (in order, respecting foreign key constraints)
const TABLES_TO_CLEAN = [
  'conversation_messages',
  'conversations',
  'credits_transactions',
  'credits',
  'notifications',
  'support_messages',
  'orders',
  'refresh_tokens',
  'materials',
  'printers',
  'delivery_options'
];

async function cleanDatabase() {
  console.log('\n🗄️  Cleaning Database Tables...');
  console.log('─────────────────────────────────');
  
  let totalDeleted = 0;
  
  for (const table of TABLES_TO_CLEAN) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (error && error.code !== '42P01') { // Ignore "table does not exist" errors
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else if (!error) {
        console.log(`   ✅ ${table}: cleared`);
        totalDeleted++;
      }
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
    }
  }
  
  console.log(`\n   📊 Cleaned ${totalDeleted} tables`);
  return totalDeleted;
}

async function cleanStorageBucket(bucketName) {
  try {
    // List all files
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 1000 });

    if (listError) {
      console.log(`   ⚠️  ${bucketName}: ${listError.message}`);
      return 0;
    }

    if (!files || files.length === 0) {
      console.log(`   ℹ️  ${bucketName}: already empty`);
      return 0;
    }

    // Delete all files
    const filePaths = files.map(file => file.name);
    const { error: deleteError } = await supabase
      .storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.log(`   ⚠️  ${bucketName}: ${deleteError.message}`);
      return 0;
    }

    console.log(`   ✅ ${bucketName}: deleted ${filePaths.length} items`);
    return filePaths.length;
  } catch (error) {
    console.log(`   ⚠️  ${bucketName}: ${error.message}`);
    return 0;
  }
}

async function cleanStorage() {
  console.log('\n📦 Cleaning Storage Buckets...');
  console.log('─────────────────────────────────');
  
  // Get all buckets
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log(`   ❌ Error listing buckets: ${error.message}`);
    return 0;
  }

  if (!buckets || buckets.length === 0) {
    console.log('   ℹ️  No storage buckets found');
    return 0;
  }

  let totalDeleted = 0;
  for (const bucket of buckets) {
    const deleted = await cleanStorageBucket(bucket.name);
    totalDeleted += deleted;
  }

  console.log(`\n   📊 Deleted ${totalDeleted} total files from ${buckets.length} bucket(s)`);
  return totalDeleted;
}

async function askConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nAre you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('🧹 ProtoLab 3D Poland - Database & Storage Cleanup');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n⚠️  WARNING: This will:');
  console.log('   1. Delete ALL data from database tables (except users)');
  console.log('   2. Delete ALL files from storage buckets');

  const confirmed = await askConfirmation();

  if (!confirmed) {
    console.log('\n❌ Operation cancelled');
    process.exit(0);
  }

  console.log('\n🚀 Starting cleanup...\n');

  // Clean database
  await cleanDatabase();

  // Clean storage
  await cleanStorage();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Cleanup Complete!');
  console.log('   - Database tables cleaned (users preserved)');
  console.log('   - Storage buckets emptied');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
