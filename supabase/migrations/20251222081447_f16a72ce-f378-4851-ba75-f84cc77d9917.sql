-- Add presentation metrics columns to aura_records table
ALTER TABLE public.aura_records 
ADD COLUMN IF NOT EXISTS presentation_type TEXT,
ADD COLUMN IF NOT EXISTS filler_word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS filler_words JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS presentation_confidence_score INTEGER,
ADD COLUMN IF NOT EXISTS pacing_score INTEGER,
ADD COLUMN IF NOT EXISTS structure_score INTEGER,
ADD COLUMN IF NOT EXISTS eye_contact_score INTEGER,
ADD COLUMN IF NOT EXISTS presentation_duration_target INTEGER,
ADD COLUMN IF NOT EXISTS presentation_topic TEXT,
ADD COLUMN IF NOT EXISTS presentation_metrics JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.aura_records.presentation_type IS 'Type: free_topic, prompted, timed, impromptu';
COMMENT ON COLUMN public.aura_records.filler_words IS 'Array of detected filler words with timestamps: [{"word": "um", "count": 3, "positions": [1.2, 5.4, 12.1]}]';
COMMENT ON COLUMN public.aura_records.presentation_confidence_score IS 'Overall presentation confidence 0-100';
COMMENT ON COLUMN public.aura_records.pacing_score IS 'Pacing quality score 0-100';
COMMENT ON COLUMN public.aura_records.structure_score IS 'Presentation structure/organization score 0-100';
COMMENT ON COLUMN public.aura_records.presentation_metrics IS 'Extended metrics: {voice_variation, volume_consistency, pause_effectiveness, opening_strength, closing_strength}';