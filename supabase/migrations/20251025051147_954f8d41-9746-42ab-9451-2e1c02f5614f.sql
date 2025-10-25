-- Allow parents to view basic profile info for students they have access requests for
CREATE POLICY "Parents can view names of students in their requests"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT student_id
    FROM public.parent_access_requests par
    JOIN public.parent_accounts pa ON pa.id = par.parent_id
    WHERE pa.user_id = auth.uid()
  )
);