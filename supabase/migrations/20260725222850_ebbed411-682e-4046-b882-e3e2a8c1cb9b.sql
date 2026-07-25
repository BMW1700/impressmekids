
-- ============ Phase 4: Ranks ============
CREATE TABLE IF NOT EXISTS public.rpg_player_ranks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id text NOT NULL,
  rank_points integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze',
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season_id)
);

GRANT SELECT, INSERT, UPDATE ON public.rpg_player_ranks TO authenticated;
GRANT ALL ON public.rpg_player_ranks TO service_role;

ALTER TABLE public.rpg_player_ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read ranks (leaderboard)"
  ON public.rpg_player_ranks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own rank row"
  ON public.rpg_player_ranks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rank row"
  ON public.rpg_player_ranks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rpg_player_ranks_season_pts
  ON public.rpg_player_ranks (season_id, rank_points DESC);

-- ============ Phase 4: Highlight Cards ============
CREATE TABLE IF NOT EXISTS public.rpg_highlight_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enemy_id text NOT NULL,
  enemy_name text,
  world_number integer,
  damage_dealt integer NOT NULL DEFAULT 0,
  turns_taken integer NOT NULL DEFAULT 0,
  perfect_blocks integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  shareable_slug text NOT NULL UNIQUE DEFAULT substring(encode(gen_random_bytes(9), 'base64') from 1 for 12),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.rpg_highlight_cards TO authenticated;
GRANT SELECT ON public.rpg_highlight_cards TO anon;
GRANT ALL ON public.rpg_highlight_cards TO service_role;

ALTER TABLE public.rpg_highlight_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own highlights"
  ON public.rpg_highlight_cards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view a highlight by slug (share link)"
  ON public.rpg_highlight_cards FOR SELECT TO anon
  USING (true);

CREATE POLICY "Users insert their own highlights"
  ON public.rpg_highlight_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rpg_highlight_cards_user
  ON public.rpg_highlight_cards (user_id, created_at DESC);

-- ============ RPC: award rank points ============
CREATE OR REPLACE FUNCTION public.rpg_award_rank_points(
  _season_id text,
  _delta integer,
  _win boolean
)
RETURNS TABLE(rank_points integer, tier text, wins integer, losses integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new_pts integer;
  v_tier text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.rpg_player_ranks (user_id, season_id, rank_points, tier, wins, losses)
  VALUES (
    v_uid, _season_id,
    GREATEST(0, _delta),
    'bronze',
    CASE WHEN _win THEN 1 ELSE 0 END,
    CASE WHEN _win THEN 0 ELSE 1 END
  )
  ON CONFLICT (user_id, season_id) DO UPDATE
    SET rank_points = GREATEST(0, public.rpg_player_ranks.rank_points + _delta),
        wins = public.rpg_player_ranks.wins + CASE WHEN _win THEN 1 ELSE 0 END,
        losses = public.rpg_player_ranks.losses + CASE WHEN _win THEN 0 ELSE 1 END,
        updated_at = now()
  RETURNING public.rpg_player_ranks.rank_points INTO v_new_pts;

  v_tier := CASE
    WHEN v_new_pts >= 2000 THEN 'master'
    WHEN v_new_pts >= 1200 THEN 'diamond'
    WHEN v_new_pts >= 700  THEN 'platinum'
    WHEN v_new_pts >= 350  THEN 'gold'
    WHEN v_new_pts >= 100  THEN 'silver'
    ELSE 'bronze'
  END;

  UPDATE public.rpg_player_ranks
    SET tier = v_tier
    WHERE user_id = v_uid AND season_id = _season_id;

  RETURN QUERY
    SELECT r.rank_points, r.tier, r.wins, r.losses
    FROM public.rpg_player_ranks r
    WHERE r.user_id = v_uid AND r.season_id = _season_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpg_award_rank_points(text, integer, boolean) TO authenticated;

-- ============ RPC: generate highlight card ============
CREATE OR REPLACE FUNCTION public.rpg_generate_highlight(
  _enemy_id text,
  _enemy_name text,
  _world_number integer,
  _damage_dealt integer,
  _turns_taken integer,
  _perfect_blocks integer,
  _stats jsonb
)
RETURNS TABLE(id uuid, shareable_slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_slug text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.rpg_highlight_cards
    (user_id, enemy_id, enemy_name, world_number, damage_dealt, turns_taken, perfect_blocks, stats)
  VALUES
    (v_uid, _enemy_id, _enemy_name, _world_number,
     COALESCE(_damage_dealt, 0), COALESCE(_turns_taken, 0), COALESCE(_perfect_blocks, 0),
     COALESCE(_stats, '{}'::jsonb))
  RETURNING public.rpg_highlight_cards.id, public.rpg_highlight_cards.shareable_slug
  INTO v_id, v_slug;

  RETURN QUERY SELECT v_id, v_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpg_generate_highlight(text, text, integer, integer, integer, integer, jsonb) TO authenticated;
