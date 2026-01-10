-- Add attachments column to conversation_messages
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Create storage bucket for conversation attachments (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('conversation-attachments', 'conversation-attachments', true);

-- Set up RLS policies for the bucket (run this in Supabase dashboard)
-- CREATE POLICY "Users can upload conversation attachments"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'conversation-attachments');

-- CREATE POLICY "Anyone can view conversation attachments"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'conversation-attachments');
