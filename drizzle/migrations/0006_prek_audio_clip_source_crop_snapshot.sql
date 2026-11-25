ALTER TABLE public.prek_level_audio_clips
  ADD COLUMN IF NOT EXISTS source_trim_start_seconds numeric,
  ADD COLUMN IF NOT EXISTS source_trim_end_seconds numeric;
COMMENT ON COLUMN public.prek_level_audio_clips.source_trim_start_seconds IS 'Video crop start the generated redub/music was made from; null = unknown.';
COMMENT ON COLUMN public.prek_level_audio_clips.source_trim_end_seconds IS 'Video crop end the generated redub/music was made from; null = whole file or unknown.';