-- Fix RLS policy role for tournament insert to match select policies
DROP POLICY IF EXISTS "t_insert" ON tournaments;

CREATE POLICY "t_insert" ON tournaments 
FOR INSERT TO authenticated
WITH CHECK (is_classroom_teacher(auth.uid(), classroom_id));