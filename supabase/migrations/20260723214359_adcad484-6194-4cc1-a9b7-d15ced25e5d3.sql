
-- Feature flag (dark-launch)
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS rpg_v2_hooks_enabled boolean NOT NULL DEFAULT false;

-- Loot inventory
CREATE TABLE IF NOT EXISTS public.player_loot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common','uncommon','rare','legendary')),
  slot text NOT NULL CHECK (slot IN ('weapon','armor','trinket')),
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  equipped boolean NOT NULL DEFAULT false,
  dropped_from_boss text,
  world_number int,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_loot_user_idx ON public.player_loot(user_id);
CREATE INDEX IF NOT EXISTS player_loot_user_equipped_idx ON public.player_loot(user_id, equipped) WHERE equipped;

GRANT SELECT, UPDATE ON public.player_loot TO authenticated;
GRANT ALL ON public.player_loot TO service_role;

ALTER TABLE public.player_loot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read their own loot"
  ON public.player_loot FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Players toggle equip on their own loot"
  ON public.player_loot FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop log (server-verified drops)
CREATE TABLE IF NOT EXISTS public.rpg_loot_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boss_id text NOT NULL,
  world_number int NOT NULL,
  loot_id uuid REFERENCES public.player_loot(id) ON DELETE SET NULL,
  rarity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rpg_loot_drops_user_idx ON public.rpg_loot_drops(user_id, created_at DESC);

GRANT SELECT ON public.rpg_loot_drops TO authenticated;
GRANT ALL ON public.rpg_loot_drops TO service_role;

ALTER TABLE public.rpg_loot_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read their own drop log"
  ON public.rpg_loot_drops FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Server-side loot roll (weighted by world number)
CREATE OR REPLACE FUNCTION public.roll_boss_loot(
  _boss_id text,
  _world_number int
)
RETURNS TABLE (
  loot_id uuid,
  item_id text,
  rarity text,
  slot text,
  stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _roll numeric;
  _rarity text;
  _slot text;
  _item_id text;
  _stats jsonb;
  _new_id uuid;
  _slots text[] := ARRAY['weapon','armor','trinket'];
  -- rarity thresholds shift with world number: harder worlds = better drops
  _legendary_chance numeric;
  _rare_chance numeric;
  _uncommon_chance numeric;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _legendary_chance := least(0.02 + (_world_number * 0.01), 0.12);
  _rare_chance := least(0.10 + (_world_number * 0.02), 0.28);
  _uncommon_chance := 0.35;

  _roll := random();
  IF _roll < _legendary_chance THEN
    _rarity := 'legendary';
  ELSIF _roll < (_legendary_chance + _rare_chance) THEN
    _rarity := 'rare';
  ELSIF _roll < (_legendary_chance + _rare_chance + _uncommon_chance) THEN
    _rarity := 'uncommon';
  ELSE
    _rarity := 'common';
  END IF;

  _slot := _slots[1 + floor(random() * 3)::int];

  -- item id follows convention: world-{n}-{slot}-{rarity}-{1..3}
  _item_id := 'w' || _world_number::text || '-' || _slot || '-' || _rarity || '-' || (1 + floor(random() * 3)::int)::text;

  -- Baseline stat rolls, scaled by rarity + world
  _stats := jsonb_build_object(
    'hp',       CASE _rarity WHEN 'legendary' THEN 25 + _world_number*3
                             WHEN 'rare'      THEN 15 + _world_number*2
                             WHEN 'uncommon'  THEN 8  + _world_number
                             ELSE 3 END,
    'attack',   CASE _rarity WHEN 'legendary' THEN 12 + _world_number*2
                             WHEN 'rare'      THEN 7  + _world_number
                             WHEN 'uncommon'  THEN 4
                             ELSE 2 END,
    'mp_regen', CASE _rarity WHEN 'legendary' THEN 3
                             WHEN 'rare'      THEN 2
                             ELSE 1 END
  );

  INSERT INTO public.player_loot(user_id, item_id, rarity, slot, stats, dropped_from_boss, world_number)
  VALUES (_uid, _item_id, _rarity, _slot, _stats, _boss_id, _world_number)
  RETURNING id INTO _new_id;

  INSERT INTO public.rpg_loot_drops(user_id, boss_id, world_number, loot_id, rarity)
  VALUES (_uid, _boss_id, _world_number, _new_id, _rarity);

  RETURN QUERY SELECT _new_id, _item_id, _rarity, _slot, _stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.roll_boss_loot(text, int) TO authenticated;
