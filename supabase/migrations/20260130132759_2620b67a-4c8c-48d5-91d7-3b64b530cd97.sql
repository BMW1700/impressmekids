-- Fix teacher syllabus storage policies (currently incorrectly referencing classrooms.name)

DROP POLICY IF EXISTS "Teachers can upload syllabus files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their syllabus files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their syllabus files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their syllabus files" ON storage.objects;

-- Teachers can upload syllabus files to their classroom folder: <classroom_id>/<filename>
CREATE POLICY "Teachers can upload syllabus files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'classroom-syllabus'
  AND public.is_classroom_teacher(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Teachers can view syllabus files in their classroom folder
CREATE POLICY "Teachers can view their syllabus files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'classroom-syllabus'
  AND public.is_classroom_teacher(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Teachers can update syllabus files in their classroom folder
CREATE POLICY "Teachers can update their syllabus files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'classroom-syllabus'
  AND public.is_classroom_teacher(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Teachers can delete syllabus files in their classroom folder
CREATE POLICY "Teachers can delete their syllabus files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'classroom-syllabus'
  AND public.is_classroom_teacher(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);