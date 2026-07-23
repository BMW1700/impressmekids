
-- Phase 3: Daily Quests + Season Pass tracking

CREATE TABLE public.rpg_daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quest_type TEXT NOT NULL,
  target_count INT NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  xp_reward INT NOT NULL DEFAULT 50,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_date, quest_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_daily_quests TO authenticated;
GRANT ALL ON public.rpg_daily_quests TO service_role;
ALTER TABLE public.rpg_daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rpg_daily_quests_self" ON public.rpg_daily_quests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.rpg_season_pass (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL,
  xp_total INT NOT NULL DEFAULT 0,
  claimed_tiers INT[] NOT NULL DEFAULT ARRAY[]::INT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_season_pass TO authenticated;
GRANT ALL ON public.rpg_season_pass TO service_role;
ALTER TABLE public.rpg_season_pass ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rpg_season_pass_self" ON public.rpg_season_pass
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: bump quest progress, mark complete, award season XP atomically
CREATE OR REPLACE FUNCTION public.rpg_award_quest_progress(
  p_quest_type TEXT,
  p_delta INT,
  p_season_id TEXT
)
RETURNS TABLE(quest_completed BOOLEAN, xp_awarded INT, season_xp INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.rpg_daily_quests%ROWTYPE;
  v_awarded INT := 0;
  v_completed BOOLEAN := FALSE;
  v_season_xp INT := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.rpg_daily_quests
    WHERE user_id = v_uid AND quest_date = CURRENT_DATE AND quest_type = p_quest_type
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  IF v_row.completed_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 0, COALESCE(
      (SELECT xp_total FROM public.rpg_season_pass WHERE user_id = v_uid AND season_id = p_season_id), 0);
    RETURN;
  END IF;

  UPDATE public.rpg_daily_quests
    SET current_count = LEAST(current_count + GREATEST(p_delta, 0), target_count),
        completed_at = CASE WHEN current_count + GREATEST(p_delta, 0) >= target_count THEN now() ELSE NULL END
    WHERE id = v_row.id
    RETURNING * INTO v_row;

  IF v_row.completed_at IS NOT NULL THEN
    v_completed := TRUE;
    v_awarded := v_row.xp_reward;
    INSERT INTO public.rpg_season_pass (user_id, season_id, xp_total)
      VALUES (v_uid, p_season_id, v_awarded)
      ON CONFLICT (user_id, season_id)
      DO UPDATE SET xp_total = public.rpg_season_pass.xp_total + v_awarded, updated_at = now()
      RETURNING xp_total INTO v_season_xp;
  ELSE
    SELECT COALESCE(xp_total, 0) INTO v_season_xp
      FROM public.rpg_season_pass WHERE user_id = v_uid AND season_id = p_season_id;
  END IF;

  RETURN QUERY SELECT v_completed, v_awarded, v_season_xp;
END;
$$;

-- RPC: claim a season pass tier (verifies XP threshold, prevents double-claim)
CREATE OR REPLACE FUNCTION public.rpg_claim_season_tier(
  p_season_id TEXT,
  p_tier INT,
  p_required_xp INT
)
RETURNS TABLE(success BOOLEAN, claimed_tiers INT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_xp INT;
  v_claimed INT[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT xp_total, rpg_season_pass.claimed_tiers INTO v_xp, v_claimed
    FROM public.rpg_season_pass
    WHERE user_id = v_uid AND season_id = p_season_id
    FOR UPDATE;

  IF NOT FOUND OR v_xp < p_required_xp OR p_tier = ANY(v_claimed) THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_claimed, ARRAY[]::INT[]);
    RETURN;
  END IF;

  UPDATE public.rpg_season_pass
    SET claimed_tiers = array_append(claimed_tiers, p_tier), updated_at = now()
    WHERE user_id = v_uid AND season_id = p_season_id
    RETURNING rpg_season_pass.claimed_tiers INTO v_claimed;

  RETURN QUERY SELECT TRUE, v_claimed;
END;
$$;

-- RPC: seed today's quests if missing (idempotent)
CREATE OR REPLACE FUNCTION public.rpg_ensure_daily_quests()
RETURNS SETOF public.rpg_daily_quests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.rpg_daily_quests (user_id, quest_type, target_count, xp_reward)
    VALUES
      (v_uid, 'defeat_enemies', 5, 50),
      (v_uid, 'defeat_bosses', 1, 100),
      (v_uid, 'battle_wins', 3, 75)
    ON CONFLICT (user_id, quest_date, quest_type) DO NOTHING;

  RETURN QUERY SELECT * FROM public.rpg_daily_quests
    WHERE user_id = v_uid AND quest_date = CURRENT_DATE
    ORDER BY quest_type;
END;
$$;
