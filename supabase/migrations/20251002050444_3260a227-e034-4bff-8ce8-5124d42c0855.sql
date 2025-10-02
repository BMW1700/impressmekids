-- Allow students to view basic profile info of teachers in their classrooms
CREATE POLICY "Students can view teacher profiles in their classrooms"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT c.teacher_id
    FROM classrooms c
    JOIN classroom_students cs ON cs.classroom_id = c.id
    WHERE cs.student_id = auth.uid()
  )
);