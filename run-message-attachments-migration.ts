import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting message attachments migration...\n');

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'SQL', 'add-message-attachments.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Extract just the ALTER TABLE part (skip storage bucket creation as it needs dashboard)
    const alterTableSQL = sql.split('-- Create storage bucket')[0].trim();

    console.log('📝 Executing SQL:\n', alterTableSQL, '\n');

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: alterTableSQL });

    if (sqlError) {
      // Try direct execution if exec_sql doesn't exist
      console.log('⚠️  exec_sql not available, trying direct execution...');
      const { error: directError } = await supabase.from('conversation_messages').select('id').limit(0);
      
      if (directError) {
        throw directError;
      }
      
      console.log('⚠️  Please run the following SQL manually in Supabase SQL Editor:\n');
      console.log(alterTableSQL);
      console.log('\n');
    } else {
      console.log('✅ Database schema updated successfully!\n');
    }

    // Create storage bucket
    console.log('📦 Creating conversation-attachments storage bucket...');
    
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'conversation-attachments');
    
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('conversation-attachments', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      });

      if (bucketError) {
        console.error('❌ Failed to create storage bucket:', bucketError);
        console.log('\n⚠️  Please create the bucket manually in Supabase dashboard:');
        console.log('   1. Go to Storage in Supabase dashboard');
        console.log('   2. Create new bucket: conversation-attachments');
        console.log('   3. Make it public');
        console.log('   4. Set max file size to 50MB\n');
      } else {
        console.log('✅ Storage bucket created successfully!\n');
      }
    } else {
      console.log('ℹ️  Storage bucket already exists\n');
    }

    console.log('🎉 Migration completed!\n');
    console.log('Next steps:');
    console.log('1. If SQL execution failed, run the SQL manually in Supabase SQL Editor');
    console.log('2. If bucket creation failed, create it manually in Supabase dashboard');
    console.log('3. Deploy the updated API to production\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
