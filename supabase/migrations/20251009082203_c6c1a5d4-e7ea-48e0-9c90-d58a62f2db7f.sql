-- Phase 2: Longitudinal Phoneme Transfer Learning

-- Add transfer learning predictions to practice exercises
ALTER TABLE practice_exercises 
ADD COLUMN transfer_predictions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN practice_exercises.transfer_predictions IS 
'ML-predicted phoneme gains based on articulatory transfer learning - stores predicted phonemes student is ready to master';

-- Add transfer learning insights to student skill vectors
ALTER TABLE student_skill_vectors
ADD COLUMN transfer_learning_insights JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN student_skill_vectors.transfer_learning_insights IS 
'Longitudinal tracking of predicted vs actual phoneme gains, including prediction accuracy over time';

-- Create index for faster transfer prediction queries
CREATE INDEX idx_practice_exercises_transfer ON practice_exercises USING GIN (transfer_predictions);

COMMENT ON INDEX idx_practice_exercises_transfer IS 'Enables fast queries on transfer learning predictions';