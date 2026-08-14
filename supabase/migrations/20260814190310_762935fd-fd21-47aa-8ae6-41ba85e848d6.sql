-- 1) Rank rows: only the server-side scoring function may write them.
DROP POLICY IF EXISTS "Users can update their own rank row" ON public.rpg_player_ranks;
DROP POLICY IF EXISTS "Users can insert their own rank row" ON public.rpg_player_ranks;

-- 2) Duel stats: read-only for clients; writes happen server-side.
DROP POLICY IF EXISTS "Students can update their own duel stats" ON public.duel_stats;
DROP POLICY IF EXISTS "Students can insert their own duel stats" ON public.duel_stats;

-- 3) District managers may only remove their own record.
DROP POLICY IF EXISTS "District managers can delete district managers" ON public.district_managers;
CREATE POLICY "District managers can delete their own record"
ON public.district_managers FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 4) public_profiles: remove platform-wide read, keep a narrow leaderboard read.
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.public_profiles;
CREATE POLICY "Authenticated users can view leaderboard participant profiles"
ON public.public_profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.rpg_player_ranks r WHERE r.user_id = public_profiles.id));