-- Bucket wedding-audio: RLS policies
-- Jalankan di Supabase Dashboard → SQL Editor

-- 1. Siapa saja bisa membaca/memutar audio (public)
CREATE POLICY "Audio public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'wedding-audio');

-- 2. User yang login bisa upload ke folder milik sendiri (user_id/filename)
CREATE POLICY "Audio authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wedding-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. User yang login bisa hapus file milik sendiri
CREATE POLICY "Audio authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wedding-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
