-- Just ensure the audio_url column exists (may have been partially applied)
ALTER TABLE public.reading_sessions 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_reading_sessions_audio_lookup
ON public.reading_sessions (student_id, created_at DESC) 
WHERE audio_url IS NOT NULL;