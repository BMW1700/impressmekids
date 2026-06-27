
-- Village zones (admin-seedable taxonomy)
CREATE TABLE public.village_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  unlock_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.village_zones TO anon, authenticated;
GRANT ALL ON public.village_zones TO service_role;
ALTER TABLE public.village_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "village_zones readable by all" ON public.village_zones FOR SELECT USING (true);
CREATE POLICY "village_zones super admin write" ON public.village_zones FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Village items (decorations / cosmetics)
CREATE TABLE public.village_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  zone_id uuid REFERENCES public.village_zones(id) ON DELETE SET NULL,
  image_url text,
  rarity text NOT NULL DEFAULT 'common',
  unlock_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_cost int NOT NULL DEFAULT 0,
  gold_cost int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.village_items TO anon, authenticated;
GRANT ALL ON public.village_items TO service_role;
ALTER TABLE public.village_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "village_items readable by all" ON public.village_items FOR SELECT USING (true);
CREATE POLICY "village_items super admin write" ON public.village_items FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Per-player village state (single row per user)
CREATE TABLE public.player_village_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked_zone_ids uuid[] NOT NULL DEFAULT '{}',
  owned_item_ids uuid[] NOT NULL DEFAULT '{}',
  placed_items jsonb NOT NULL DEFAULT '{}'::jsonb,
  tokens int NOT NULL DEFAULT 0,
  last_village_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.player_village_state TO authenticated;
GRANT ALL ON public.player_village_state TO service_role;
ALTER TABLE public.player_village_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "village_state self read" ON public.player_village_state FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "village_state self upsert" ON public.player_village_state FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "village_state self update" ON public.player_village_state FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Audit log of unlocks
CREATE TABLE public.village_unlock_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.village_zones(id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.village_items(id) ON DELETE SET NULL,
  reason text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX village_unlock_log_user_idx ON public.village_unlock_log(user_id, unlocked_at DESC);
GRANT SELECT ON public.village_unlock_log TO authenticated;
GRANT ALL ON public.village_unlock_log TO service_role;
ALTER TABLE public.village_unlock_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unlock_log self read" ON public.village_unlock_log FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- updated_at trigger reuse
CREATE TRIGGER trg_village_zones_updated BEFORE UPDATE ON public.village_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_village_items_updated BEFORE UPDATE ON public.village_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_player_village_state_updated BEFORE UPDATE ON public.player_village_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed zones
INSERT INTO public.village_zones (slug, name, description, unlock_requirement, sort_order) VALUES
  ('yard',     'Benny''s Yard',      'Where Benny plays.',          '{"type":"level","world_id":101,"min_level":1}'::jsonb, 1),
  ('bedroom',  'Cozy Bedroom',       'Benny''s reading nook.',      '{"type":"world_complete","world_id":101}'::jsonb,       2),
  ('kitchen',  'Kitchen',            'Snack time with Benny.',      '{"type":"world_complete","world_id":102}'::jsonb,       3),
  ('festival', 'Festival Yard',      'Fireworks and friends.',      '{"type":"world_complete","world_id":103}'::jsonb,       4);

-- Seed 20 starter decorations across zones
WITH z AS (SELECT id, slug FROM public.village_zones)
INSERT INTO public.village_items (slug, name, zone_id, rarity, unlock_requirement, token_cost, gold_cost, sort_order)
SELECT v.slug, v.name, z.id, v.rarity, v.req::jsonb, v.tc, v.gc, v.ord
FROM (VALUES
  ('yard_doghouse',     'Red Doghouse',     'yard',     'common', '{}', 1, 50, 1),
  ('yard_ball',         'Squeaky Ball',     'yard',     'common', '{}', 0, 25, 2),
  ('yard_tree',         'Apple Tree',       'yard',     'common', '{}', 1, 75, 3),
  ('yard_flowers',      'Flower Bed',       'yard',     'common', '{}', 1, 60, 4),
  ('yard_bench',        'Wooden Bench',     'yard',     'uncommon', '{"type":"streak","days":3}', 2, 100, 5),
  ('bedroom_bed',       'Cozy Bed',         'bedroom',  'common', '{}', 1, 75, 1),
  ('bedroom_lamp',      'Reading Lamp',     'bedroom',  'common', '{}', 1, 50, 2),
  ('bedroom_rug',       'Star Rug',         'bedroom',  'common', '{}', 0, 40, 3),
  ('bedroom_books',     'Bookshelf',        'bedroom',  'uncommon', '{}', 2, 120, 4),
  ('bedroom_window',    'Moon Window',      'bedroom',  'rare', '{"type":"streak","days":7}', 3, 150, 5),
  ('kitchen_table',     'Kitchen Table',    'kitchen',  'common', '{}', 1, 80, 1),
  ('kitchen_fridge',    'Friendly Fridge',  'kitchen',  'common', '{}', 1, 90, 2),
  ('kitchen_apron',     'Chef Apron (Benny)','kitchen', 'uncommon', '{}', 2, 100, 3),
  ('kitchen_cookies',   'Cookie Jar',       'kitchen',  'common', '{}', 0, 35, 4),
  ('kitchen_plant',     'Kitchen Plant',    'kitchen',  'common', '{}', 1, 45, 5),
  ('festival_lanterns', 'Paper Lanterns',   'festival', 'uncommon', '{}', 2, 110, 1),
  ('festival_stage',    'Tiny Stage',       'festival', 'rare',   '{}', 3, 180, 2),
  ('festival_fireworks','Fireworks Prop',   'festival', 'rare',   '{"type":"streak","days":5}', 3, 200, 3),
  ('festival_banner',   'Friendship Banner','festival', 'common', '{}', 1, 60, 4),
  ('festival_drum',     'Festival Drum',    'festival', 'uncommon','{}', 2, 95, 5)
) AS v(slug, name, zone_slug, rarity, req, tc, gc, ord)
JOIN z ON z.slug = v.zone_slug;

-- check_village_unlocks: source of truth for what user has earned
CREATE OR REPLACE FUNCTION public.check_village_unlocks(_user_id uuid)
RETURNS TABLE(zone_id uuid, zone_slug text, reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT z.id, z.slug,
    CASE
      WHEN z.unlock_requirement->>'type' = 'level' THEN 'Completed required level'
      WHEN z.unlock_requirement->>'type' = 'world_complete' THEN 'Completed required world'
      ELSE 'Unlocked'
    END AS reason
  FROM public.village_zones z
  WHERE
    (z.unlock_requirement->>'type' = 'level' AND EXISTS (
      SELECT 1 FROM public.campaign_progress cp
      WHERE cp.user_id = _user_id
        AND cp.world_id = (z.unlock_requirement->>'world_id')::int
        AND cp.completed = true
    ))
    OR
    (z.unlock_requirement->>'type' = 'world_complete' AND EXISTS (
      SELECT 1 FROM public.campaign_progress cp
      WHERE cp.user_id = _user_id
        AND cp.world_id = (z.unlock_requirement->>'world_id')::int
        AND cp.completed = true
    ));
END;
$$;

-- Award token + sync unlocks. Called after a level completes.
CREATE OR REPLACE FUNCTION public.award_village_progress(_user_id uuid, _tokens int DEFAULT 1)
RETURNS public.player_village_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _state public.player_village_state;
  _new_zones uuid[];
BEGIN
  INSERT INTO public.player_village_state (user_id, tokens)
  VALUES (_user_id, GREATEST(_tokens, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET tokens = public.player_village_state.tokens + GREATEST(_tokens, 0),
        updated_at = now()
  RETURNING * INTO _state;

  SELECT COALESCE(array_agg(zone_id), '{}') INTO _new_zones
  FROM public.check_village_unlocks(_user_id)
  WHERE zone_id <> ALL(_state.unlocked_zone_ids);

  IF array_length(_new_zones, 1) > 0 THEN
    UPDATE public.player_village_state
       SET unlocked_zone_ids = _state.unlocked_zone_ids || _new_zones,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING * INTO _state;

    INSERT INTO public.village_unlock_log (user_id, zone_id, reason)
    SELECT _user_id, z, 'reading_progress' FROM unnest(_new_zones) z;
  END IF;

  RETURN _state;
END;
$$;

REVOKE ALL ON FUNCTION public.award_village_progress(uuid, int) FROM public;
GRANT EXECUTE ON FUNCTION public.award_village_progress(uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_village_unlocks(uuid) TO authenticated, service_role;
