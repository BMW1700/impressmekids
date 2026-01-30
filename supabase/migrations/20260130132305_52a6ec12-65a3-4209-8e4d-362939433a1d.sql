-- Drop the incorrect INSERT policy and recreate with correct logic
DROP POLICY IF EXISTS "Teachers can upload syllabus files" ON storage.objects;

CREATE POLICY "Teachers can upload syllabus files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'classroom-syllabus' 
  AND auth.uid() IN (
    SELECT teacher_id 
    FROM classrooms 
    WHERE id::text = (storage.foldername(name))[1]
  )
);