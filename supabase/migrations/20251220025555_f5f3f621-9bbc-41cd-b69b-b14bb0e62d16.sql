-- Eliminate remaining profiles RLS recursion by removing district checks from admin policies
-- and ensuring relationship checks do not invoke RLS on tables whose policies reference profiles.

-- 1) Admin policies on profiles: remove all district-based checks (admin can access all profiles)
DROP POLICY IF EXISTS "Admins can view all profiles with email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles with email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Teacher access to a student's basic info: use a SECURITY DEFINER function with row_security off
--    to avoid recursion via classrooms/classroom_students RLS policies.
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = _student_id
      AND c.teacher_id = _teacher_id
  );
$$;

DROP POLICY IF EXISTS "Teachers can view student basic info only" ON public.profiles;
CREATE POLICY "Teachers can view student basic info only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (id <> auth.uid())
  AND public.is_teacher_of_student(auth.uid(), id)
);

-- 3) Parent helper functions used in profiles policies: disable row_security to avoid indirect recursion
CREATE OR REPLACE FUNCTION public.is_parent_of_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = _user_id
      AND psl.student_id = _student_id
      AND psl.approved = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_parent_view_student_profile(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_access_requests par
    JOIN public.parent_accounts pa ON pa.id = par.parent_id
    WHERE pa.user_id = _user_id
      AND par.student_id = _student_id
  );
$$;
