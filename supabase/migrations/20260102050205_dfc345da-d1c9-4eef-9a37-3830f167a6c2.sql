-- Add reading_mode column to reading_sessions table for tracking where reading occurred
ALTER TABLE reading_sessions 
ADD COLUMN reading_mode text DEFAULT 'word_by_word';

-- Add comment explaining the column
COMMENT ON COLUMN reading_sessions.reading_mode IS 'Source mode: word_by_word, story_mode, rpg_battle, tug_of_war, balloon_battle, tournament, screening, etc.';

-- Create index for efficient querying by mode
CREATE INDEX idx_reading_sessions_reading_mode ON reading_sessions(reading_mode);

-- Create index for efficient querying by student + mode
CREATE INDEX idx_reading_sessions_student_mode ON reading_sessions(student_id, reading_mode);