CREATE TABLE IF NOT EXISTS public.castle_unlocked_heroes (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade_mode  text NOT NULL,
  hero_id     text NOT NULL,
  source      text NOT NULL DEFAULT 'campaign', -- 'campaign' | 'shop' | 'starter'
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, grade_mode, hero_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.castle_unlocked_heroes TO authenticated;
GRANT ALL ON public.castle_unlocked_heroes TO service_role;

ALTER TABLE public.castle_unlocked_heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own unlocked heroes"
  ON public.castle_unlocked_heroes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocked heroes"
  ON public.castle_unlocked_heroes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked heroes"
  ON public.castle_unlocked_heroes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);