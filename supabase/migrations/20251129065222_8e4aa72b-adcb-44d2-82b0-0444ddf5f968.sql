-- Fix tournament_players INSERT policy - proper logic
DROP POLICY IF EXISTS "tp_insert" ON public.tournament_players;

CREATE POLICY "tp_insert"
ON public.tournament_players
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be inserting their own profile_id
  profile_id = auth.uid()
  AND
  -- User must be enrolled in the tournament's classroom
  EXISTS (
    SELECT 1 
    FROM tournaments t
    JOIN classroom_students cs ON cs.classroom_id = t.classroom_id
    WHERE t.id = tournament_id 
    AND cs.student_id = auth.uid()
  )
);