-- Fix RLS policy role for tournament teacher select access
DROP POLICY IF EXISTS "t_select_teacher" ON tournaments;

CREATE POLICY "t_select_teacher" ON tournaments 
FOR SELECT TO authenticated
USING (is_classroom_teacher(auth.uid(), classroom_id));