-- Fix tournament_players INSERT policy to verify student is in classroom
DROP POLICY IF EXISTS "tp_insert" ON public.tournament_players;

CREATE POLICY "tp_insert"
ON public.tournament_players
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify the student is enrolled in the tournament's classroom
  EXISTS (
    SELECT 1 
    FROM tournaments t
    JOIN classroom_students cs ON cs.classroom_id = t.classroom_id
    WHERE t.id = tournament_id 
    AND cs.student_id = auth.uid()
    AND profile_id = auth.uid()
  )
);