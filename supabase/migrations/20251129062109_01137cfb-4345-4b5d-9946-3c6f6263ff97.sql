-- Allow classroom students to view all tournament players in their classroom tournaments
-- This enables students to see the leaderboard/bracket once seeded
CREATE POLICY "Classroom students can view tournament players"
ON public.tournament_players FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.classroom_students cs ON cs.classroom_id = t.classroom_id
    WHERE t.id = tournament_players.tournament_id
    AND cs.student_id = auth.uid()
  )
);