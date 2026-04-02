-- Create public documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated org members to upload to their org folder
CREATE POLICY "Org members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Allow authenticated org members to read their org's documents
CREATE POLICY "Org members can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Allow authenticated org members to delete their org's documents
CREATE POLICY "Org members can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM profiles WHERE id = auth.uid()
  )
);
