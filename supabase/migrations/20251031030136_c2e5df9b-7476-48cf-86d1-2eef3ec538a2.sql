-- Create security definer function to check if parent can view classroom
CREATE OR REPLACE FUNCTION public.can_parent_view_classroom(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN EXISTS (
    SELECT 1
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = _user_id
      AND psl.approved = true
      AND cs.classroom_id = _classroom_id
  );
END;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view their children's classrooms" ON public.classrooms;

-- Create new safe policy using security definer function
CREATE POLICY "Parents can view their children's classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (can_parent_view_classroom(auth.uid(), id));