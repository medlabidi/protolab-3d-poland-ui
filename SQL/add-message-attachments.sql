-- ============================================
-- Step 1: Add attachments column (RUN THIS FIRST)
-- ============================================
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS attachments JSONB;

-- ============================================
-- Step 2: Create storage bucket (RUN THIS SECOND)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'conversation-attachments', 
  'conversation-attachments', 
  true,
  52428800, -- 50MB
  ARRAY[
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
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 3: Set up storage policies (RUN THIS THIRD)
-- ============================================
CREATE POLICY "Users can upload conversation attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conversation-attachments');

CREATE POLICY "Anyone can view conversation attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'conversation-attachments');

CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'conversation-attachments');
