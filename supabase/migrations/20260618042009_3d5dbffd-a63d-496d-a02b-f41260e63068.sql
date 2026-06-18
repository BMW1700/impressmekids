ALTER TABLE public.prek_level_audio_clips
ADD COLUMN IF NOT EXISTS playback_rate real NOT NULL DEFAULT 1.0
CHECK (playback_rate BETWEEN 0.5 AND 2.0);