-- Drop and recreate the check constraint to include all game types
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS valid_game_type;

ALTER TABLE public.tournaments ADD CONSTRAINT valid_game_type 
CHECK (game_type IN (
  'jeopardy_duel',
  'name_that_animal',
  'number_maker',
  'us_states_quiz',
  'tug_of_war',
  'math_race',
  'word_builder',
  'science_sprint',
  'geography_quest',
  'spelling_bee'
));