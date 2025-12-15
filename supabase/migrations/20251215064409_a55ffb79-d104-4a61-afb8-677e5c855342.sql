-- Add storage RLS policy for teachers to access student audio recordings
-- Teachers can access audio from students in their classrooms

CREATE POLICY "Teachers can access student audio recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'aura-audio'
  AND EXISTS (
    SELECT 1
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
    AND cs.student_id::text = (storage.foldername(name))[1]
  )
);

-- Also allow students to read their own recordings
CREATE POLICY "Students can read their own audio recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'aura-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);