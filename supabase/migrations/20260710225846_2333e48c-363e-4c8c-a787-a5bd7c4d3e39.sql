
ALTER TABLE public.prek_worlds ADD COLUMN IF NOT EXISTS redub_voice_id text;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS redub_voice_id text;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS redub_stability numeric NOT NULL DEFAULT 0.5;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS redub_similarity_boost numeric NOT NULL DEFAULT 0.85;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS mute_source_video_audio boolean NOT NULL DEFAULT true;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS redub_audio_paths jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.prek_levels ADD COLUMN IF NOT EXISTS redub_generated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.prek_redub_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.prek_levels(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total int NOT NULL DEFAULT 0,
  completed int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  last_error text,
  scene_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_redub_jobs TO authenticated;
GRANT ALL ON public.prek_redub_jobs TO service_role;

ALTER TABLE public.prek_redub_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read redub jobs"
  ON public.prek_redub_jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage redub jobs"
  ON public.prek_redub_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
