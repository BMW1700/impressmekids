-- Enhance student_skill_vectors with detailed phoneme and prosody tracking
ALTER TABLE student_skill_vectors 
ADD COLUMN IF NOT EXISTS phoneme_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS prosody_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS fluency_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS weekly_improvement NUMERIC DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_vectors_student ON student_skill_vectors(student_id);
CREATE INDEX IF NOT EXISTS idx_aura_records_profile_created ON aura_records(profile_id, created_at DESC);

-- Comment on new columns
COMMENT ON COLUMN student_skill_vectors.phoneme_scores IS 'Individual phoneme accuracy scores (e.g., {"r": 0.85, "th": 0.72})';
COMMENT ON COLUMN student_skill_vectors.prosody_metrics IS 'Pitch, rhythm, and intonation patterns';
COMMENT ON COLUMN student_skill_vectors.fluency_metrics IS 'Pause patterns, hesitations, speaking rate consistency';
COMMENT ON COLUMN student_skill_vectors.weekly_improvement IS 'Week-over-week improvement percentage';