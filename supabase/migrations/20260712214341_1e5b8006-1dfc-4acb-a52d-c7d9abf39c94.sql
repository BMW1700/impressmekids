ALTER TABLE public.prek_levels
ADD COLUMN IF NOT EXISTS music_audio_paths jsonb NOT NULL DEFAULT '{}'::jsonb;