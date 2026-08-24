ALTER TABLE public.prek_level_audio_clips
  ADD COLUMN IF NOT EXISTS manual_crop_start_seconds numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_crop_end_seconds numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.prek_level_audio_clips.manual_crop_start_seconds IS
  'Additional non-destructive crop from the beginning, applied after source-video trim alignment.';
COMMENT ON COLUMN public.prek_level_audio_clips.manual_crop_end_seconds IS
  'Additional non-destructive crop from the end, applied before source-video trim alignment.';