-- Atomic Castle Swarm upgrade purchase: debits coins from campaign_progress and
-- increments the chosen upgrade track in a single transaction. Prevents the
-- "free upgrades" bug where the row was upserted without spending coins.

CREATE OR REPLACE FUNCTION public.purchase_castle_upgrade(
  p_grade_mode text,
  p_track text,
  p_cost integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF p_track NOT IN ('hp_level', 'damage_level', 'cap_level') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid track');
  END IF;

  IF p_cost IS NULL OR p_cost <= 0 OR p_cost > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid cost');
  END IF;

  v_col := p_track;

  -- Lock balance row
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

  -- Get current upgrade level
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

  -- Debit coins
  UPDATE public.campaign_progress
  SET total_gold = v_new_balance, updated_at = now()
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode;

  -- Upsert upgrade row with new level for the chosen track
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
$$;