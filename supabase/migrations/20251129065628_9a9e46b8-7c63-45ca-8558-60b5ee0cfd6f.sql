-- Add UPDATE policy for tournament_players upsert operations
CREATE POLICY "tp_upsert"
ON public.tournament_players
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());