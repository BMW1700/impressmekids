-- Create security definer function to check if parent can view student profile
CREATE OR REPLACE FUNCTION public.can_parent_view_student_profile(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_access_requests par
    JOIN parent_accounts pa ON pa.id = par.parent_id
    WHERE pa.user_id = _user_id
      AND par.student_id = _student_id
  )
$$;

-- Update profiles RLS policy to use the security definer function
DROP POLICY IF EXISTS "Parents can view names of students in their requests" ON public.profiles;
CREATE POLICY "Parents can view names of students in their requests"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_parent_view_student_profile(auth.uid(), id));