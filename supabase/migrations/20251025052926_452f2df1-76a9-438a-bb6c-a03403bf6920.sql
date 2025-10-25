-- Fix parent_student_links policies to use authenticated role
DROP POLICY IF EXISTS "Parents can view their own links" ON public.parent_student_links;
CREATE POLICY "Parents can view their own links"
ON public.parent_student_links
FOR SELECT
TO authenticated
USING (parent_id = get_parent_id(auth.uid()));

DROP POLICY IF EXISTS "Students can view their own parent links" ON public.parent_student_links;
CREATE POLICY "Students can view their own parent links"
ON public.parent_student_links
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Fix profiles policy to use authenticated role
DROP POLICY IF EXISTS "Parents can view names of students in their requests" ON public.profiles;
CREATE POLICY "Parents can view names of students in their requests"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT par.student_id
    FROM parent_access_requests par
    JOIN parent_accounts pa ON pa.id = par.parent_id
    WHERE pa.user_id = auth.uid()
  )
);