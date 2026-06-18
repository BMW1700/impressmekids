ALTER TABLE public.prek_level_audio_clips ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.prek_level_audio_tracks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS prek_level_audio_clips_active_idx ON public.prek_level_audio_clips(level_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS prek_level_audio_tracks_active_idx ON public.prek_level_audio_tracks(level_id) WHERE deleted_at IS NULL;