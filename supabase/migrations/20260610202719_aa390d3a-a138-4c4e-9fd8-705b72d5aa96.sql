-- Fix 1: Path-scope the assignment-audio bucket SELECT policy so students cannot read each other's audio.
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;

CREATE POLICY "Students can read their own assignment audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can read assignment audio for their students"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-audio'
  AND EXISTS (
    SELECT 1
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = cs.student_id::text
  )
);

-- Fix 2: Repair the two aura-audio "teacher with consent" policies that compared classroom NAME
-- instead of the student UUID, which made the consent check effectively never match.

DROP POLICY IF EXISTS "Teachers access student audio with consent" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view student audio with consent" ON storage.objects;

CREATE POLICY "Teachers access student audio with consent"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      JOIN public.parent_consents pc ON pc.student_id = cs.student_id
      WHERE c.teacher_id = auth.uid()
        AND cs.student_id::text = (storage.foldername(objects.name))[1]
        AND pc.aura_recording_consent = true
    )
  )
);

CREATE POLICY "Teachers can view student audio with consent"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio'
  AND EXISTS (
    SELECT 1
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    JOIN public.parent_consents pc ON pc.student_id = cs.student_id
    WHERE c.teacher_id = auth.uid()
      AND cs.student_id::text = (storage.foldername(objects.name))[1]
      AND pc.aura_recording_consent = true
  )
);