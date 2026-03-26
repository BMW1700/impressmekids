
-- Fix game_players policies (column is player_id, not profile_id)
DROP POLICY IF EXISTS "Players can join games" ON public.game_players;
CREATE POLICY "Players can join games"
ON public.game_players
FOR INSERT
TO authenticated
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "Players can update own records" ON public.game_players;
CREATE POLICY "Players can update own records"
ON public.game_players
FOR UPDATE
TO authenticated
USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());
