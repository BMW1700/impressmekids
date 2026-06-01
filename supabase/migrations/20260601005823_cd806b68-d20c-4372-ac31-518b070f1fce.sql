
-- New upgrade tracks
ALTER TABLE public.castle_upgrades
  ADD COLUMN IF NOT EXISTS gold_find_level smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crit_level smallint NOT NULL DEFAULT 0;

ALTER TABLE public.castle_upgrades
  DROP CONSTRAINT IF EXISTS castle_upgrades_gold_find_level_check,
  DROP CONSTRAINT IF EXISTS castle_upgrades_crit_level_check;
ALTER TABLE public.castle_upgrades
  ADD CONSTRAINT castle_upgrades_gold_find_level_check CHECK (gold_find_level >= 0 AND gold_find_level <= 5),
  ADD CONSTRAINT castle_upgrades_crit_level_check CHECK (crit_level >= 0 AND crit_level <= 5);

-- Allow RPC to purchase new tracks
CREATE OR REPLACE FUNCTION public.purchase_castle_upgrade(p_grade_mode text, p_track text, p_cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_current_level integer;
  v_new_balance integer;
  v_new_level integer;
  v_col text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_grade_mode NOT IN ('k5', '6to12') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid grade_mode');
  END IF;
  IF p_track NOT IN ('hp_level', 'damage_level', 'cap_level', 'gold_find_level', 'crit_level') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid track');
  END IF;
  IF p_cost IS NULL OR p_cost <= 0 OR p_cost > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid cost');
  END IF;

  v_col := p_track;

  SELECT COALESCE(total_gold, 0) INTO v_balance
  FROM public.campaign_progress
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No progress row yet — play a run first to earn coins');
  END IF;
  IF v_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough coins', 'balance', v_balance);
  END IF;

  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM public.castle_upgrades WHERE user_id = $1 AND grade_mode = $2',
    v_col
  ) INTO v_current_level USING v_user_id, p_grade_mode;
  v_current_level := COALESCE(v_current_level, 0);

  IF v_current_level >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already maxed');
  END IF;

  v_new_level := v_current_level + 1;
  v_new_balance := v_balance - p_cost;

  UPDATE public.campaign_progress
  SET total_gold = v_new_balance, updated_at = now()
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode;

  EXECUTE format(
    'INSERT INTO public.castle_upgrades (user_id, grade_mode, %I, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id, grade_mode)
     DO UPDATE SET %I = EXCLUDED.%I, updated_at = now()',
    v_col, v_col, v_col
  ) USING v_user_id, p_grade_mode, v_new_level;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'track', p_track,
    'new_level', v_new_level
  );
END;
$function$;

-- Endless leaderboard RPC: top wave per user in the given grade mode.
CREATE OR REPLACE FUNCTION public.get_castle_endless_leaderboard(
  p_grade_mode text,
  p_scope text DEFAULT 'all_time',
  p_limit integer DEFAULT 25
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  best_wave integer,
  best_words integer,
  best_accuracy numeric,
  achieved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_since timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF p_grade_mode NOT IN ('k5', '6to12') THEN RETURN; END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN p_limit := 25; END IF;
  v_since := CASE WHEN p_scope = 'week' THEN now() - interval '7 days' ELSE 'epoch'::timestamptz END;

  RETURN QUERY
  WITH best AS (
    SELECT
      r.user_id,
      MAX(r.wave_reached) AS best_wave
    FROM public.castle_swarm_runs r
    WHERE r.grade_mode = p_grade_mode
      AND r.challenge_seed IS NULL
      AND r.created_at >= v_since
    GROUP BY r.user_id
  ),
  top_runs AS (
    SELECT DISTINCT ON (r.user_id)
      r.user_id,
      r.wave_reached,
      r.words_read,
      r.accuracy,
      r.created_at
    FROM public.castle_swarm_runs r
    JOIN best b ON b.user_id = r.user_id AND b.best_wave = r.wave_reached
    WHERE r.grade_mode = p_grade_mode AND r.challenge_seed IS NULL
    ORDER BY r.user_id, r.created_at ASC
  )
  SELECT
    t.user_id,
    COALESCE(
      NULLIF(split_part(p.full_name, ' ', 1), ''),
      'Player ' || substring(t.user_id::text, 1, 4)
    ) AS display_name,
    t.wave_reached AS best_wave,
    t.words_read AS best_words,
    t.accuracy AS best_accuracy,
    t.created_at AS achieved_at
  FROM top_runs t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.wave_reached DESC, t.created_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_castle_endless_leaderboard(text, text, integer) TO authenticated;
