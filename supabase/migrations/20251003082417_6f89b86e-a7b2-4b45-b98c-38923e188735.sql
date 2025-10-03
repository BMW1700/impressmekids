-- Add game_type column to tournaments table
ALTER TABLE tournaments 
ADD COLUMN game_type TEXT NOT NULL DEFAULT 'jeopardy_duel';

-- Add check constraint for valid game types
ALTER TABLE tournaments
ADD CONSTRAINT valid_game_type 
CHECK (game_type IN (
  'jeopardy_duel',
  'math_race', 
  'word_builder',
  'science_sprint',
  'geography_quest',
  'spelling_bee'
));