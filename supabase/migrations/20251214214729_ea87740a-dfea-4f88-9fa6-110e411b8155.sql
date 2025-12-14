-- Ensure aura-audio bucket exists and has proper policies
-- The bucket should already exist, but ensure policies are in place

-- Drop existing storage policies for aura-audio if they exist (to recreate cleanly)
DO $$
BEGIN
  -- Try to drop existing policies
  BEGIN
    DROP POLICY IF EXISTS "Students can upload their own audio" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Students can view their own audio" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Teachers can view student audio with consent" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- Create storage policies for aura-audio bucket
-- Students can upload audio to their own folder
CREATE POLICY "Students can upload their own audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aura-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can view/download their own audio
CREATE POLICY "Students can view their own audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can view student audio (for benchmark review)
CREATE POLICY "Teachers can view student audio with consent"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio' 
  AND EXISTS (
    SELECT 1 FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id::text = (storage.foldername(name))[1]
    AND c.teacher_id = auth.uid()
  )
);