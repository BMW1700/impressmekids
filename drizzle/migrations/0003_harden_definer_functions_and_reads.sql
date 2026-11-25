REVOKE EXECUTE ON FUNCTION public.prek_merge_level_json(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prek_merge_level_json(uuid, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.purchase_castle_upgrade(p_grade_mode text, p_track text, p_cost integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_current_level integer;
  v_new_balance integer;
  v_new_level integer;
  r public.castle_upgrades%ROWTYPE;
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

  SELECT * INTO r FROM public.castle_upgrades WHERE user_id = v_user_id AND grade_mode = p_grade_mode;
  v_current_level := COALESCE(CASE p_track
    WHEN 'hp_level' THEN r.hp_level
    WHEN 'damage_level' THEN r.damage_level
    WHEN 'cap_level' THEN r.cap_level
    WHEN 'gold_find_level' THEN r.gold_find_level
    WHEN 'crit_level' THEN r.crit_level END, 0);

  IF v_current_level >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already maxed');
  END IF;

  v_new_level := v_current_level + 1;
  v_new_balance := v_balance - p_cost;

  UPDATE public.campaign_progress
  SET total_gold = v_new_balance, updated_at = now()
  WHERE student_id = v_user_id AND grade_mode = p_grade_mode;

  INSERT INTO public.castle_upgrades (user_id, grade_mode, updated_at)
  VALUES (v_user_id, p_grade_mode, now())
  ON CONFLICT (user_id, grade_mode) DO NOTHING;

  UPDATE public.castle_upgrades SET
    hp_level = CASE WHEN p_track = 'hp_level' THEN v_new_level ELSE hp_level END,
    damage_level = CASE WHEN p_track = 'damage_level' THEN v_new_level ELSE damage_level END,
    cap_level = CASE WHEN p_track = 'cap_level' THEN v_new_level ELSE cap_level END,
    gold_find_level = CASE WHEN p_track = 'gold_find_level' THEN v_new_level ELSE gold_find_level END,
    crit_level = CASE WHEN p_track = 'crit_level' THEN v_new_level ELSE crit_level END,
    updated_at = now()
  WHERE user_id = v_user_id AND grade_mode = p_grade_mode;

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance, 'track', p_track, 'new_level', v_new_level);
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

DROP POLICY IF EXISTS "village_items readable by signed-in users" ON public.village_items;
CREATE POLICY "village_items readable by users with a role" ON public.village_items FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "village_zones readable by signed-in users" ON public.village_zones;
CREATE POLICY "village_zones readable by users with a role" ON public.village_zones FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Signed-in users can view school settings" ON public.school_settings;
CREATE POLICY "Users with a role can view school settings" ON public.school_settings FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));