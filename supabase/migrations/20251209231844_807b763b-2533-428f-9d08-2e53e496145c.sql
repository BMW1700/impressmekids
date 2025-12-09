-- Add RLS policy for parents to view their children's assignment answers
CREATE POLICY "Parents can view their children's assignment answers"
ON public.assignment_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM assignment_submissions asub
    JOIN parent_student_links psl ON psl.student_id = asub.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE asub.id = assignment_answers.submission_id
      AND pa.user_id = auth.uid()
      AND psl.approved = true
      AND asub.status IN ('graded', 'completed')
  )
);

-- Add RLS policy for parents to view assignment questions for their children's assignments
CREATE POLICY "Parents can view questions for their children's assignments"
ON public.assignment_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM assignments a
    JOIN classroom_students cs ON cs.classroom_id = a.classroom_id
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE a.id = assignment_questions.assignment_id
      AND pa.user_id = auth.uid()
      AND psl.approved = true
  )
);