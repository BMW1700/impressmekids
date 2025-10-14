-- Create RLS policy to allow teachers to delete tournaments in their classrooms
CREATE POLICY "Teachers can delete tournaments in their classrooms"
ON tournaments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classrooms
    WHERE classrooms.id = tournaments.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);