
ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS music_audio_paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS music_generated_at timestamptz;

-- Broaden source_kind check to include 'music' clips (LALAL.AI extracted stems).
ALTER TABLE public.prek_level_audio_clips
  DROP CONSTRAINT IF EXISTS prek_level_audio_clips_source_kind_chk;
ALTER TABLE public.prek_level_audio_clips
  ADD CONSTRAINT prek_level_audio_clips_source_kind_chk
  CHECK (source_kind IN ('manual','redub','music'));

-- Uniqueness for the music clip per scene, mirroring redub.
CREATE UNIQUE INDEX IF NOT EXISTS prek_audio_clips_music_uniq
  ON public.prek_level_audio_clips(level_id, track_index, anchor_scene_key)
  WHERE source_kind = 'music' AND deleted_at IS NULL;
