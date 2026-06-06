
CREATE OR REPLACE FUNCTION public.purchase_castle_hero_level(p_grade_mode text, p_hero_id text, p_cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_current_level integer;
  v_new_level integer;
  v_new_balance integer;
  v_unlock_check integer;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_grade_mode NOT IN ('k5', '6to12') THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid grade mode'); END IF;
  IF p_hero_id IS NULL OR length(p_hero_id) > 64 OR p_cost IS NULL OR p_cost <= 0 OR p_cost > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid upgrade');
  END IF;

  -- Starter heroes are implicitly unlocked and never written to castle_unlocked_heroes.
  IF p_hero_id NOT IN ('archer') THEN
    SELECT 1 INTO v_unlock_check
    FROM public.castle_unlocked_heroes
    WHERE user_id = v_user_id AND grade_mode = p_grade_mode AND hero_id = p_hero_id;
    IF v_unlock_check IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unlock this hero first');
    END IF;
  END IF;

  SELECT COALESCE(total_gold, 0) INTO v_balance
  FROM public.campaign_progress
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode
  FOR UPDATE;
  IF v_balance IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Play a run first to earn coins'); END IF;

  SELECT COALESCE(level, 0) INTO v_current_level
  FROM public.castle_hero_upgrades
  WHERE user_id = v_user_id AND grade_mode = p_grade_mode AND hero_id = p_hero_id
  FOR UPDATE;
  v_current_level := COALESCE(v_current_level, 0);
  IF v_current_level >= 5 THEN RETURN jsonb_build_object('success', false, 'error', 'Already maxed'); END IF;
  IF v_balance < p_cost THEN RETURN jsonb_build_object('success', false, 'error', 'Not enough coins', 'balance', v_balance); END IF;

  v_new_level := v_current_level + 1;
  v_new_balance := v_balance - p_cost;
  UPDATE public.campaign_progress
  SET total_gold = v_new_balance, updated_at = now()
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode;

  INSERT INTO public.castle_hero_upgrades (user_id, grade_mode, hero_id, level, updated_at)
  VALUES (v_user_id, p_grade_mode, p_hero_id, v_new_level, now())
  ON CONFLICT (user_id, grade_mode, hero_id)
  DO UPDATE SET level = EXCLUDED.level, updated_at = now();

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance, 'hero_id', p_hero_id, 'new_level', v_new_level);
END;
$function$;
