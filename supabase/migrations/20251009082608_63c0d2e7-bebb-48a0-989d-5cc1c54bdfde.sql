-- Phase 3: Contextual Difficulty Scaling

-- Add difficulty tracking to practice exercises
ALTER TABLE practice_exercises
ADD COLUMN difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
ADD COLUMN adaptive_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN success_rate NUMERIC(5,2) DEFAULT NULL CHECK (success_rate >= 0 AND success_rate <= 100);

COMMENT ON COLUMN practice_exercises.difficulty_level IS '1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert';
COMMENT ON COLUMN practice_exercises.adaptive_metadata IS 'Stores difficulty scaling context: previous performance, progression speed, etc.';
COMMENT ON COLUMN practice_exercises.success_rate IS 'Percentage success rate for this difficulty level (0-100)';

-- Add difficulty progression tracking to student skill vectors
ALTER TABLE student_skill_vectors
ADD COLUMN current_difficulty_level INTEGER DEFAULT 1 CHECK (current_difficulty_level >= 1 AND current_difficulty_level <= 5),
ADD COLUMN difficulty_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN performance_trend NUMERIC(5,2) DEFAULT 0,
ADD COLUMN last_difficulty_update TIMESTAMP WITH TIME ZONE DEFAULT now();

COMMENT ON COLUMN student_skill_vectors.current_difficulty_level IS 'Current adaptive difficulty level for exercise generation';
COMMENT ON COLUMN student_skill_vectors.difficulty_history IS 'Array of {timestamp, level, performance} tracking difficulty progression';
COMMENT ON COLUMN student_skill_vectors.performance_trend IS 'Recent performance trend: positive = improving, negative = struggling';

-- Create index for difficulty queries
CREATE INDEX idx_practice_exercises_difficulty ON practice_exercises(student_id, difficulty_level, completed);
CREATE INDEX idx_skill_vectors_difficulty ON student_skill_vectors(student_id, current_difficulty_level);

-- Add performance metrics to aura_records for difficulty calculation
ALTER TABLE aura_records
ADD COLUMN difficulty_score INTEGER DEFAULT NULL CHECK (difficulty_score >= 1 AND difficulty_score <= 5),
ADD COLUMN performance_metrics JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN aura_records.difficulty_score IS 'Assessed difficulty of the practice session (1-5)';
COMMENT ON COLUMN aura_records.performance_metrics IS 'Detailed metrics: speed, accuracy, consistency for difficulty scaling';