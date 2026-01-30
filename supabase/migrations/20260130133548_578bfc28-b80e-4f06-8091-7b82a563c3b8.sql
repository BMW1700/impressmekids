-- Allow students to view their teacher's profile (for displaying teacher names on content)
CREATE POLICY "Students can view their classroom teachers"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT c.teacher_id
    FROM classrooms c
    JOIN classroom_students cs ON cs.classroom_id = c.id
    WHERE cs.student_id = auth.uid()
  )
);