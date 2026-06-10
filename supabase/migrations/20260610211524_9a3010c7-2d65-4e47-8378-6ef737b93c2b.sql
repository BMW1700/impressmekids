
-- Fix qimg read policy: use objects.name throughout, not classrooms.name
DROP POLICY IF EXISTS "qimg_read_classroom_members" ON storage.objects;
CREATE POLICY "qimg_read_classroom_members"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-question-images'
    AND (
      EXISTS (
        SELECT 1 FROM public.classrooms c
        WHERE c.teacher_id = auth.uid()
          AND c.id::text = split_part(storage.objects.name, '/', 1)
      )
      OR EXISTS (
        SELECT 1 FROM public.classroom_students cs
        WHERE cs.student_id = auth.uid()
          AND cs.classroom_id::text = split_part(storage.objects.name, '/', 1)
      )
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Tournament questions: kill the overly permissive tq_* policies
DROP POLICY IF EXISTS "tq_delete" ON public.tournament_questions;
DROP POLICY IF EXISTS "tq_insert" ON public.tournament_questions;
DROP POLICY IF EXISTS "tq_select_teacher" ON public.tournament_questions;

-- Email failures: add service_role insert + admin delete
CREATE POLICY "service_role_insert_email_failures"
  ON public.email_failures FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "admins_delete_email_failures"
  ON public.email_failures FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
