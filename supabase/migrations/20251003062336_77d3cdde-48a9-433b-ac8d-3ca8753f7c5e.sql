-- Allow teachers to view profiles of students in their classrooms
CREATE POLICY "Teachers can view student profiles in their classrooms"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);