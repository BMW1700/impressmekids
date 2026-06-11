
-- 1. Bootstrap super_admin role for matthewross750@gmail.com (immediate + future)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'matthewross750@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'matthewross750@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_super_admin_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bootstrap_super_admin ON auth.users;
CREATE TRIGGER trg_bootstrap_super_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.bootstrap_super_admin_role();

-- 2. Worlds
CREATE TABLE IF NOT EXISTS public.prek_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_worlds TO authenticated;
GRANT ALL ON public.prek_worlds TO service_role;
ALTER TABLE public.prek_worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads published worlds"
  ON public.prek_worlds FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage worlds"
  ON public.prek_worlds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Levels
CREATE TABLE IF NOT EXISTS public.prek_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.prek_worlds(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  ending_line TEXT NOT NULL DEFAULT '',
  opening_video_url TEXT,
  closing_video_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (world_id, level_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_levels TO authenticated;
GRANT ALL ON public.prek_levels TO service_role;
ALTER TABLE public.prek_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads published levels"
  ON public.prek_levels FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage levels"
  ON public.prek_levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 4. Level words
CREATE TABLE IF NOT EXISTS public.prek_level_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.prek_levels(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  word TEXT NOT NULL,
  ask_line TEXT NOT NULL DEFAULT '',
  success_line TEXT NOT NULL DEFAULT '',
  first_video_url TEXT,
  second_video_url TEXT,
  hold_poster_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prek_level_words_level ON public.prek_level_words (level_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_level_words TO authenticated;
GRANT ALL ON public.prek_level_words TO service_role;
ALTER TABLE public.prek_level_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads words for published levels"
  ON public.prek_level_words FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.prek_levels l
      WHERE l.id = level_id AND l.is_published = true
    )
  );
CREATE POLICY "Super admins manage level words"
  ON public.prek_level_words FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 5. updated_at touch
CREATE OR REPLACE FUNCTION public.prek_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prek_touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_prek_worlds_updated BEFORE UPDATE ON public.prek_worlds
  FOR EACH ROW EXECUTE FUNCTION public.prek_touch_updated_at();
CREATE TRIGGER trg_prek_levels_updated BEFORE UPDATE ON public.prek_levels
  FOR EACH ROW EXECUTE FUNCTION public.prek_touch_updated_at();
CREATE TRIGGER trg_prek_level_words_updated BEFORE UPDATE ON public.prek_level_words
  FOR EACH ROW EXECUTE FUNCTION public.prek_touch_updated_at();

-- 6. Seed Visit Grandma
DO $$
DECLARE
  v_world_id UUID;
  v_level_id UUID;
BEGIN
  INSERT INTO public.prek_worlds (world_number, title, description, difficulty, sort_order, is_published)
  VALUES (101, 'Nabu Village', 'Help your friends solve everyday adventures in the village.', 'easy', 1, true)
  ON CONFLICT (world_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO v_world_id;

  INSERT INTO public.prek_levels (
    world_id, level_number, title, description, goal, ending_line, sort_order, is_published
  ) VALUES (
    v_world_id, 1,
    'Help Benny Visit Grandma',
    'Benny needs to cross the woods to visit Grandma. Read the words to help him on his way!',
    'Help Benny visit Grandma!',
    'We made it to Grandma''s!',
    1, true
  )
  ON CONFLICT (world_id, level_number) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO v_level_id;

  DELETE FROM public.prek_level_words WHERE level_id = v_level_id;
  INSERT INTO public.prek_level_words (level_id, sort_order, word, ask_line, success_line) VALUES
    (v_level_id, 1, 'JUMP',  'I need to...',            'Whoosh! Over we go!'),
    (v_level_id, 2, 'BOOTS', 'My feet need big...',     'Big boots! Splish splash!'),
    (v_level_id, 3, 'KEY',   'To open it I need a...',  'Click! The gate is open!'),
    (v_level_id, 4, 'PUSH',  'How do I move this?',     'Heave-ho! There it goes!'),
    (v_level_id, 5, 'SNEAK', 'Shhh… what should I do?', 'Tip-toe, tip-toe… past the bear!');
END $$;
