
-- FIX 1: Tighten classroom_students INSERT policy
DROP POLICY IF EXISTS "Students can join classrooms" ON public.classroom_students;

CREATE POLICY "Students join via approved request only"
ON public.classroom_students
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.classroom_join_requests jr
    WHERE jr.student_id = auth.uid()
      AND jr.classroom_id = classroom_students.classroom_id
      AND jr.status = 'approved'
  )
);

-- FIX 2: Protect districts.primary_contact_email
CREATE OR REPLACE VIEW public.districts_safe
WITH (security_invoker = true)
AS
SELECT
  district_code,
  name,
  slug,
  email_domains,
  logo_url,
  subscription_tier,
  is_visible,
  created_at
FROM public.districts;

GRANT SELECT ON public.districts_safe TO authenticated, anon;

DROP POLICY IF EXISTS "Authenticated users can view visible districts" ON public.districts;
DROP POLICY IF EXISTS "Authenticated users within district can view" ON public.districts;

CREATE POLICY "Admins and district managers view full district row"
ON public.districts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_district_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.district_admins da
    WHERE da.user_id = auth.uid()
      AND da.district_name = districts.name
  )
);
