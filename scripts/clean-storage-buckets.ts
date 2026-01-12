/**
 * Clean Supabase Storage Buckets
 * This script removes all files from Supabase storage buckets
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
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanBucket(bucketName: string) {
  console.log(`\n🗑️  Cleaning bucket: ${bucketName}`);
  
  try {
    // List all files in the bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list();

    if (listError) {
      console.error(`   ❌ Error listing files in ${bucketName}:`, listError.message);
      return { success: false, deleted: 0 };
    }

    if (!files || files.length === 0) {
      console.log(`   ℹ️  Bucket is already empty`);
      return { success: true, deleted: 0 };
    }

    console.log(`   📁 Found ${files.length} files/folders`);

    // Delete all files
    const filePaths = files.map(file => file.name);
    
    const { data: deleteData, error: deleteError } = await supabase
      .storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error(`   ❌ Error deleting files:`, deleteError.message);
      return { success: false, deleted: 0 };
    }

    console.log(`   ✅ Deleted ${filePaths.length} items`);
    return { success: true, deleted: filePaths.length };
  } catch (error) {
    console.error(`   ❌ Unexpected error:`, error);
    return { success: false, deleted: 0 };
  }
}

async function listAllBuckets() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return [];
    }

    return buckets.map(b => b.name);
  } catch (error) {
    console.error('❌ Unexpected error listing buckets:', error);
    return [];
  }
}

async function main() {
  console.log('🧹 Starting Supabase Storage Cleanup');
  console.log('═══════════════════════════════════');

  // Get all buckets
  const buckets = await listAllBuckets();
  
  if (buckets.length === 0) {
    console.log('\nℹ️  No storage buckets found');
    return;
  }

  console.log(`\n📦 Found ${buckets.length} bucket(s): ${buckets.join(', ')}`);

  // Clean each bucket
  let totalDeleted = 0;
  let successCount = 0;

  for (const bucket of buckets) {
    const result = await cleanBucket(bucket);
    if (result.success) {
      successCount++;
      totalDeleted += result.deleted;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════');
  console.log('📊 Cleanup Summary:');
  console.log(`   Buckets processed: ${successCount}/${buckets.length}`);
  console.log(`   Total files deleted: ${totalDeleted}`);
  console.log('✅ Storage cleanup completed!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
