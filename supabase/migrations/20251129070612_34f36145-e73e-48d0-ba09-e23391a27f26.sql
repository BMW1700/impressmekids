-- Drop existing problematic policies
DROP POLICY IF EXISTS "tp_select_teacher" ON public.tournament_players;
DROP POLICY IF EXISTS "Classroom students can view tournament players" ON public.tournament_players;

-- Recreate policies using helper functions with SET LOCAL row_security = off
CREATE POLICY "tp_select_teacher"
ON public.tournament_players
FOR SELECT
TO authenticated
USING (is_tournament_teacher(auth.uid(), tournament_id));

CREATE POLICY "tp_select_classroom_student"
ON public.tournament_players
FOR SELECT
TO authenticated
USING (is_tournament_classroom_member(auth.uid(), tournament_id));