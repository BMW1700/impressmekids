
CREATE TABLE public.castle_swarm_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grade_mode TEXT NOT NULL CHECK (grade_mode IN ('k5','6to12')),
  character_id TEXT NOT NULL,
  wave_reached INTEGER NOT NULL DEFAULT 0,
  words_read INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  knights_summoned INTEGER NOT NULL DEFAULT 0,
  enemy_castle_hp_dealt INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  ended_reason TEXT NOT NULL DEFAULT 'loss' CHECK (ended_reason IN ('win','loss','quit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.castle_swarm_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own castle runs"
  ON public.castle_swarm_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own castle runs"
  ON public.castle_swarm_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_castle_swarm_runs_user_mode
  ON public.castle_swarm_runs (user_id, grade_mode, wave_reached DESC);
