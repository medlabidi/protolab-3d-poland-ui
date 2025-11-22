import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (for backend operations)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Helper: Upload file buffer to temp-files bucket
export async function uploadTempFile(
  sessionId: string,
  filename: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ path: string; url: string }> {
  const filePath = `${sessionId}/${filename}`;
  const bucketName = process.env.SUPABASE_BUCKET_TEMP!;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    path: data.path,
    url: `${supabaseUrl}/storage/v1/object/private/${bucketName}/${data.path}`,
  };
}

// Helper: Download file from temp-files bucket
export async function downloadTempFile(sessionId: string, filename: string): Promise<Buffer> {
  const filePath = `${sessionId}/${filename}`;
  const bucketName = process.env.SUPABASE_BUCKET_TEMP!;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .download(filePath);

  if (error) throw new Error(`Download failed: ${error.message}`);

  return Buffer.from(await data.arrayBuffer());
}

// Helper: Move file from temp-files to print-jobs
export async function moveFileToJob(
  sessionId: string,
  filename: string,
  jobId: string
): Promise<{ path: string; url: string }> {
  const tempBucket = process.env.SUPABASE_BUCKET_TEMP!;
  const jobsBucket = process.env.SUPABASE_BUCKET_JOBS!;
  const tempPath = `${sessionId}/${filename}`;
  const jobPath = `${jobId}/${filename}`;

  // Download from temp
  const fileBuffer = await downloadTempFile(sessionId, filename);

  // Upload to jobs bucket
  const { data, error: uploadError } = await supabaseAdmin.storage
    .from(jobsBucket)
    .upload(jobPath, fileBuffer, { upsert: false });

  if (uploadError) throw new Error(`Upload to jobs failed: ${uploadError.message}`);

  // Delete from temp
  const { error: deleteError } = await supabaseAdmin.storage
    .from(tempBucket)
    .remove([tempPath]);

  if (deleteError) throw new Error(`Cleanup failed: ${deleteError.message}`);

  return {
    path: data.path,
    url: `${supabaseUrl}/storage/v1/object/private/${jobsBucket}/${data.path}`,
  };
}

// Helper: Delete temp file
export async function deleteTempFile(sessionId: string, filename: string): Promise<void> {
  const filePath = `${sessionId}/${filename}`;
  const bucketName = process.env.SUPABASE_BUCKET_TEMP!;

  const { error } = await supabaseAdmin.storage.from(bucketName).remove([filePath]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// Helper: List files in temp folder (for cleanup/verification)
export async function listTempFiles(sessionId: string): Promise<string[]> {
  const bucketName = process.env.SUPABASE_BUCKET_TEMP!;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .list(sessionId);

  if (error) throw new Error(`List failed: ${error.message}`);

  return data?.map((f) => f.name) || [];
}
