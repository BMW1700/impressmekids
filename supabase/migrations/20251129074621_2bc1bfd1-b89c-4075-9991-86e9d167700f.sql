-- Drop the problematic function-based policy
DROP POLICY IF EXISTS tp_select_teacher ON tournament_players;

-- Create new policy with inline EXISTS (no function dependency)
CREATE POLICY tp_select_teacher ON tournament_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM tournaments t
      JOIN classrooms c ON c.id = t.classroom_id
      WHERE t.id = tournament_players.tournament_id
        AND c.teacher_id = auth.uid()
    )
  );