-- Drop the restrictive parent policy that only allows graded/completed status
DROP POLICY IF EXISTS "Parents can view graded submissions" ON assignment_submissions;

-- Create new policy allowing parents to see ALL their linked student's submissions
CREATE POLICY "Parents can view linked student submissions" ON assignment_submissions
  FOR SELECT USING (
    student_id IN (
      SELECT psl.student_id 
      FROM parent_student_links psl
      JOIN parent_accounts pa ON pa.id = psl.parent_id
      WHERE pa.user_id = auth.uid() AND psl.approved = true
    )
  );