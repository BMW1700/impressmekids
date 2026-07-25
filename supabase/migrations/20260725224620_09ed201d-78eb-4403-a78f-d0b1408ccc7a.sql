
-- Active cosmetic title on ranks (from claimed season pass tiers)
ALTER TABLE public.rpg_player_ranks
  ADD COLUMN IF NOT EXISTS active_title text,
  ADD COLUMN IF NOT EXISTS active_badge text;

-- Anti-cheat: rate limit rank point awards (200 pts / hour ceiling)
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
  v_recent_gain integer;
  v_capped_delta integer := _delta;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Anti-cheat: hourly gain cap (positive deltas only)
  IF _delta > 0 THEN
    SELECT COALESCE(SUM(GREATEST(0, LEAST(_delta, 50))), 0) INTO v_recent_gain
    FROM public.rpg_player_ranks
    WHERE user_id = v_uid
      AND season_id = _season_id
      AND updated_at > now() - interval '1 hour';
    IF v_recent_gain >= 200 THEN
      v_capped_delta := 0;
    ELSIF v_recent_gain + _delta > 200 THEN
      v_capped_delta := 200 - v_recent_gain;
    END IF;
  END IF;

  INSERT INTO public.rpg_player_ranks (user_id, season_id, rank_points, tier, wins, losses)
  VALUES (
    v_uid, _season_id,
    GREATEST(0, v_capped_delta),
    'bronze',
    CASE WHEN _win THEN 1 ELSE 0 END,
    CASE WHEN _win THEN 0 ELSE 1 END
  )
  ON CONFLICT (user_id, season_id) DO UPDATE
    SET rank_points = GREATEST(0, public.rpg_player_ranks.rank_points + v_capped_delta),
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

-- Public highlight lookup by slug (no auth needed for share link viewing)
CREATE OR REPLACE FUNCTION public.rpg_get_highlight_by_slug(_slug text)
RETURNS TABLE(
  enemy_name text,
  world_number integer,
  damage_dealt integer,
  turns_taken integer,
  perfect_blocks integer,
  stats jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enemy_name, world_number, damage_dealt, turns_taken, perfect_blocks, stats, created_at
  FROM public.rpg_highlight_cards
  WHERE shareable_slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.rpg_get_highlight_by_slug(text) TO anon, authenticated;

-- Set active cosmetic title/badge when a season tier is claimed
CREATE OR REPLACE FUNCTION public.rpg_set_active_cosmetic(
  _season_id text,
  _kind text,
  _reward_id text,
  _label text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.rpg_player_ranks (user_id, season_id, rank_points, tier, wins, losses,
    active_title, active_badge)
  VALUES (v_uid, _season_id, 0, 'bronze', 0, 0,
    CASE WHEN _kind = 'title' THEN _label ELSE NULL END,
    CASE WHEN _kind = 'badge' THEN _reward_id ELSE NULL END)
  ON CONFLICT (user_id, season_id) DO UPDATE
    SET active_title = CASE WHEN _kind = 'title' THEN _label ELSE public.rpg_player_ranks.active_title END,
        active_badge = CASE WHEN _kind = 'badge' THEN _reward_id ELSE public.rpg_player_ranks.active_badge END,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpg_set_active_cosmetic(text, text, text, text) TO authenticated;
