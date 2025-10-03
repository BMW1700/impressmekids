-- Fix infinite recursion in tournament RLS policies
-- Replace function calls with direct subqueries to avoid recursion

DROP POLICY IF EXISTS "t_insert" ON tournaments;
DROP POLICY IF EXISTS "t_select_teacher" ON tournaments;
DROP POLICY IF EXISTS "t_update" ON tournaments;

-- Insert policy: check directly without function call
CREATE POLICY "t_insert" ON tournaments 
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = tournaments.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Select policy for teachers: direct subquery
CREATE POLICY "t_select_teacher" ON tournaments 
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = tournaments.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Update policy for teachers: direct subquery
CREATE POLICY "t_update" ON tournaments 
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = tournaments.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);