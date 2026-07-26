-- ============ RPG seasons (database-driven) ============
CREATE TABLE public.rpg_seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#f97316',
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rpg_seasons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_seasons TO authenticated;
GRANT ALL ON public.rpg_seasons TO service_role;

ALTER TABLE public.rpg_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read seasons"
  ON public.rpg_seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can insert seasons"
  ON public.rpg_seasons FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update seasons"
  ON public.rpg_seasons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete seasons"
  ON public.rpg_seasons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_rpg_seasons_updated_at
  BEFORE UPDATE ON public.rpg_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only one active season at a time.
CREATE UNIQUE INDEX rpg_seasons_single_active ON public.rpg_seasons (is_active) WHERE is_active;

-- Seed with the currently hardcoded season so behaviour is unchanged.
INSERT INTO public.rpg_seasons (id, name, theme_color, starts_at, ends_at, is_active, tiers)
VALUES (
  'season-2026-w30', 'The Ember Trials', '#f97316', '2026-07-20', '2026-07-27', true,
  '[
    {"tier":1,"requiredXp":50,"rewardKind":"badge","rewardId":"trial_initiate","rewardLabel":"Trial Initiate","rewardEmoji":"🔥"},
    {"tier":2,"requiredXp":150,"rewardKind":"title","rewardId":"ember_seeker","rewardLabel":"Ember Seeker","rewardEmoji":"🌟"},
    {"tier":3,"requiredXp":300,"rewardKind":"banner","rewardId":"ember_banner","rewardLabel":"Ember Banner","rewardEmoji":"🚩"},
    {"tier":4,"requiredXp":500,"rewardKind":"title","rewardId":"flame_warden","rewardLabel":"Flame Warden","rewardEmoji":"⚔️"},
    {"tier":5,"requiredXp":750,"rewardKind":"badge","rewardId":"ember_crown","rewardLabel":"Ember Crown","rewardEmoji":"👑"},
    {"tier":6,"requiredXp":1000,"rewardKind":"title","rewardId":"ember_champion","rewardLabel":"Champion of Embers","rewardEmoji":"🏆"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============ Wider daily quest pool ============
CREATE OR REPLACE FUNCTION public.rpg_ensure_daily_quests()
RETURNS SETOF public.rpg_daily_quests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_pool JSONB := '[
    {"t":"defeat_enemies","n":5,"xp":50},
    {"t":"defeat_bosses","n":1,"xp":100},
    {"t":"battle_wins","n":3,"xp":75},
    {"t":"perfect_battles","n":1,"xp":90},
    {"t":"words_read","n":40,"xp":60},
    {"t":"play_streak","n":1,"xp":40},
    {"t":"minigame_wins","n":2,"xp":65}
  ]'::jsonb;
  v_seed BIGINT;
  v_item JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Stable per user per day: same board no matter how often this is called.
  v_seed := ('x' || substr(md5(v_uid::text || CURRENT_DATE::text), 1, 8))::bit(32)::bigint;

  FOR v_item IN
    SELECT elem FROM jsonb_array_elements(v_pool) WITH ORDINALITY AS t(elem, ord)
    ORDER BY md5((v_seed + ord)::text)
    LIMIT 3
  LOOP
    INSERT INTO public.rpg_daily_quests (user_id, quest_type, target_count, xp_reward)
      VALUES (v_uid, v_item->>'t', (v_item->>'n')::int, (v_item->>'xp')::int)
      ON CONFLICT (user_id, quest_date, quest_type) DO NOTHING;
  END LOOP;

  RETURN QUERY SELECT * FROM public.rpg_daily_quests
    WHERE user_id = v_uid AND quest_date = CURRENT_DATE
    ORDER BY quest_type;
END;
$function$;