-- Add ML output columns to reading_sessions
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS cognitive_load_avg DECIMAL;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS recommended_difficulty INTEGER;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS phoneme_accuracy JSONB DEFAULT '{}';

-- Create index for faster analytics queries on reading_sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_accuracy ON reading_sessions(student_id, accuracy_percent DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created ON reading_sessions(created_at DESC);