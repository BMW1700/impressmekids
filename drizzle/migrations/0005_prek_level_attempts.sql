CREATE TABLE public.prek_level_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grade_mode text NOT NULL DEFAULT 'k5',
  world_number int NOT NULL,
  level_number int NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.prek_level_attempts TO authenticated;
GRANT ALL ON public.prek_level_attempts TO service_role;
ALTER TABLE public.prek_level_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own prek attempts" ON public.prek_level_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own prek attempts" ON public.prek_level_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX prek_level_attempts_user_idx ON public.prek_level_attempts (user_id, grade_mode);