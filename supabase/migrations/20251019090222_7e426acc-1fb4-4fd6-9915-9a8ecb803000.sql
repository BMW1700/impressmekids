-- Create security definer function to check if user is parent of student
CREATE OR REPLACE FUNCTION public.is_parent_of_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = _user_id
      AND psl.student_id = _student_id
      AND psl.approved = true
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view their children's classroom enrollments" ON classroom_students;

-- Create new policy using security definer function
CREATE POLICY "Parents can view their children's classroom enrollments"
ON classroom_students FOR SELECT
TO authenticated
USING (is_parent_of_student(auth.uid(), student_id));