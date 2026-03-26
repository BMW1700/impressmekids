
-- Drop remaining public-role game_players INSERT policy
DROP POLICY IF EXISTS "System can insert game players" ON public.game_players;

-- The "Service role can insert game players" and "Players can join games" policies 
-- already handle legitimate inserts
