const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFileUpload() {
  console.log('🧪 Testing Supabase File Upload\n');
  console.log('📍 Supabase URL:', process.env.SUPABASE_URL);
  console.log('🪣 Buckets:', {
    temp: process.env.SUPABASE_BUCKET_TEMP,
    jobs: process.env.SUPABASE_BUCKET_JOBS
  });
  console.log('');

  try {
    // Test 1: Check if buckets exist
    console.log('Test 1: Checking if storage buckets exist...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    const tempBucket = buckets.find(b => b.name === process.env.SUPABASE_BUCKET_TEMP);
    const jobsBucket = buckets.find(b => b.name === process.env.SUPABASE_BUCKET_JOBS);
    
    console.log('✓ Buckets found:');
    console.log('  - temp-files:', tempBucket ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('  - print-jobs:', jobsBucket ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('');
    
    if (!tempBucket || !jobsBucket) {
      console.error('⚠️  Missing buckets. Creating them...\n');
      
      if (!tempBucket) {
        const { error } = await supabase.storage.createBucket('temp-files', {
          public: false,
          fileSizeLimit: 200 * 1024 * 1024 // 200MB
        });
        if (error) {
          console.error('❌ Failed to create temp-files bucket:', error.message);
        } else {
          console.log('✅ Created temp-files bucket');
        }
      }
      
      if (!jobsBucket) {
        const { error } = await supabase.storage.createBucket('print-jobs', {
          public: false,
          fileSizeLimit: 200 * 1024 * 1024 // 200MB
        });
        if (error) {
          console.error('❌ Failed to create print-jobs bucket:', error.message);
        } else {
          console.log('✅ Created print-jobs bucket');
        }
      }
      console.log('');
    }
    
    // Test 2: Create a dummy STL file content
    console.log('Test 2: Creating test 3D file...');
    const testFileName = 'test-cube.stl';
    const testFileContent = `solid cube
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 1 0
      vertex 0 1 0
    endloop
  endfacet
endsolid cube`;
    
    const testBuffer = Buffer.from(testFileContent, 'utf-8');
    console.log('✓ Created test STL file:', testFileName, '(', testBuffer.length, 'bytes)');
    console.log('');
    
    // Test 3: Upload to temp-files bucket
    console.log('Test 3: Uploading to temp-files bucket...');
    const tempSessionId = 'test-session-' + Date.now();
    const tempFilePath = `${tempSessionId}/${testFileName}`;
    
    const { data: tempUpload, error: tempError } = await supabase.storage
      .from('temp-files')
      .upload(tempFilePath, testBuffer, {
        contentType: 'application/sla',
        upsert: false
      });
    
    if (tempError) {
      console.error('❌ Upload to temp-files failed:', tempError.message);
    } else {
      console.log('✅ Uploaded to temp-files successfully!');
      console.log('   Path:', tempUpload.path);
      console.log('');
      
      // Test 4: Download from temp-files
      console.log('Test 4: Downloading from temp-files...');
      const { data: downloaded, error: downloadError } = await supabase.storage
        .from('temp-files')
        .download(tempFilePath);
      
      if (downloadError) {
        console.error('❌ Download failed:', downloadError.message);
      } else {
        const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
        console.log('✅ Downloaded successfully! Size:', downloadedBuffer.length, 'bytes');
        console.log('   Content matches:', downloadedBuffer.equals(testBuffer) ? '✅ YES' : '❌ NO');
        console.log('');
      }
      
      // Test 5: Upload to print-jobs bucket
      console.log('Test 5: Uploading to print-jobs bucket...');
      const orderId = 'test-order-' + Date.now();
      const jobFilePath = `${orderId}/${testFileName}`;
      
      const { data: jobUpload, error: jobError } = await supabase.storage
        .from('print-jobs')
        .upload(jobFilePath, testBuffer, {
          contentType: 'application/sla',
          upsert: false
        });
      
      if (jobError) {
        console.error('❌ Upload to print-jobs failed:', jobError.message);
      } else {
        console.log('✅ Uploaded to print-jobs successfully!');
        console.log('   Path:', jobUpload.path);
        
        // Get URL
        const { data: urlData } = supabase.storage
          .from('print-jobs')
          .getPublicUrl(jobUpload.path);
        
        console.log('   URL:', urlData.publicUrl);
        console.log('');
      }
      
      // Test 6: List files
      console.log('Test 6: Listing files in buckets...');
      const { data: tempFiles, error: tempListError } = await supabase.storage
        .from('temp-files')
        .list(tempSessionId);
      
      if (!tempListError && tempFiles) {
        console.log('✓ Files in temp-files/' + tempSessionId + ':', tempFiles.length);
        tempFiles.forEach(f => console.log('  -', f.name, '(' + f.metadata.size + ' bytes)'));
      }
      
      const { data: jobFiles, error: jobListError } = await supabase.storage
        .from('print-jobs')
        .list(orderId);
      
      if (!jobListError && jobFiles) {
        console.log('✓ Files in print-jobs/' + orderId + ':', jobFiles.length);
        jobFiles.forEach(f => console.log('  -', f.name, '(' + f.metadata.size + ' bytes)'));
      }
      console.log('');
      
      // Test 7: Cleanup
      console.log('Test 7: Cleaning up test files...');
      const { error: deleteTempError } = await supabase.storage
        .from('temp-files')
        .remove([tempFilePath]);
      
      if (deleteTempError) {
        console.error('❌ Failed to delete temp file:', deleteTempError.message);
      } else {
        console.log('✅ Deleted temp file');
      }
      
      const { error: deleteJobError } = await supabase.storage
        .from('print-jobs')
        .remove([jobFilePath]);
      
      if (deleteJobError) {
        console.error('❌ Failed to delete job file:', deleteJobError.message);
      } else {
        console.log('✅ Deleted job file');
      }
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFileUpload();
