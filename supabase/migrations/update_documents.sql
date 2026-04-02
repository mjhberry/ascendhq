-- Add file_url for direct access link and uploaded_by for attribution
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
