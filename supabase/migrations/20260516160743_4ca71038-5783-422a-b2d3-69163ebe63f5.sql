
-- Campaign progress
CREATE TABLE public.castle_swarm_campaign_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grade_mode TEXT NOT NULL CHECK (grade_mode IN ('k5','6to12')),
  level_id TEXT NOT NULL,
  stars SMALLINT NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_wave INTEGER NOT NULL DEFAULT 0,
  best_accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_words_read INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, grade_mode, level_id)
);
ALTER TABLE public.castle_swarm_campaign_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user view own castle campaign" ON public.castle_swarm_campaign_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user insert own castle campaign" ON public.castle_swarm_campaign_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own castle campaign" ON public.castle_swarm_campaign_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_castle_campaign_user ON public.castle_swarm_campaign_progress (user_id, grade_mode);

-- Knight upgrades
CREATE TABLE public.castle_upgrades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grade_mode TEXT NOT NULL CHECK (grade_mode IN ('k5','6to12')),
  hp_level SMALLINT NOT NULL DEFAULT 0 CHECK (hp_level BETWEEN 0 AND 5),
  damage_level SMALLINT NOT NULL DEFAULT 0 CHECK (damage_level BETWEEN 0 AND 5),
  cap_level SMALLINT NOT NULL DEFAULT 0 CHECK (cap_level BETWEEN 0 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, grade_mode)
);
ALTER TABLE public.castle_upgrades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user view own castle upgrades" ON public.castle_upgrades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user insert own castle upgrades" ON public.castle_upgrades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own castle upgrades" ON public.castle_upgrades FOR UPDATE USING (auth.uid() = user_id);

-- Daily challenge seed on runs
ALTER TABLE public.castle_swarm_runs ADD COLUMN challenge_seed TEXT;
CREATE INDEX idx_castle_runs_seed ON public.castle_swarm_runs (challenge_seed, user_id);
