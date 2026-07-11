
ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS redub_isolated_paths jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.prek_level_audio_clips
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'manual';

DO $$ BEGIN
  ALTER TABLE public.prek_level_audio_clips
    ADD CONSTRAINT prek_level_audio_clips_source_kind_chk
    CHECK (source_kind IN ('manual','redub'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS prek_audio_clips_redub_uniq
  ON public.prek_level_audio_clips(level_id, track_index, anchor_scene_key)
  WHERE source_kind = 'redub' AND deleted_at IS NULL;
