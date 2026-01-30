-- Add RLS policy for parents to view school resources of their linked students
CREATE POLICY "Parents can view their children's school resources"
ON public.school_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    JOIN profiles p ON p.id = psl.student_id
    WHERE pa.user_id = auth.uid()
      AND psl.approved = true
      AND p.school_id = school_resources.school_id
  )
);