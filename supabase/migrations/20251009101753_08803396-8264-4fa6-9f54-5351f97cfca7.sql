-- Fix storage policy to allow nested folder uploads for teachers
DROP POLICY IF EXISTS "Teachers can upload audio to their assignments" ON storage.objects;

CREATE POLICY "Teachers can upload audio to their assignments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-audio'
  AND auth.role() = 'authenticated'
  AND name LIKE 'teacher/%'
);