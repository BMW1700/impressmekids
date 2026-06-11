
DROP POLICY IF EXISTS "Allow consent request creation" ON public.student_signup_consents;

CREATE POLICY "service_role_insert_consents"
ON public.student_signup_consents
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can view visitors on campus" ON public.visitors;
CREATE POLICY "Teachers can view visitors at their school"
ON public.visitors
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND is_on_campus = true
  AND school_id IS NOT NULL
  AND school_id = (SELECT p.school_id::text FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers can check in visitors" ON public.visitors;
CREATE POLICY "Teachers can check in visitors at their school"
ON public.visitors
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'teacher'::app_role)
    AND school_id IS NOT NULL
    AND school_id = (SELECT p.school_id::text FROM public.profiles p WHERE p.id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Teachers can update visitor status" ON public.visitors;
CREATE POLICY "Teachers can update visitors at their school"
ON public.visitors
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'teacher'::app_role)
    AND school_id IS NOT NULL
    AND school_id = (SELECT p.school_id::text FROM public.profiles p WHERE p.id = auth.uid())
  )
);

CREATE POLICY "service_role_writes_error_patterns_insert"
ON public.student_error_patterns
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "service_role_writes_error_patterns_update"
ON public.student_error_patterns
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
