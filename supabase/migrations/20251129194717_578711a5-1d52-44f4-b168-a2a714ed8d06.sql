-- Fix foreign key constraints to allow tournament deletion
-- This prevents cascade delete errors when tournament_players are deleted

-- Fix match_events buzz_owner reference
ALTER TABLE match_events
DROP CONSTRAINT IF EXISTS match_events_buzz_owner_tournament_player_id_fkey;

ALTER TABLE match_events
ADD CONSTRAINT match_events_buzz_owner_tournament_player_id_fkey
  FOREIGN KEY (buzz_owner_tournament_player_id)
  REFERENCES tournament_players(id)
  ON DELETE SET NULL;

-- Fix match_events answered_by reference
ALTER TABLE match_events
DROP CONSTRAINT IF EXISTS match_events_answered_by_tournament_player_id_fkey;

ALTER TABLE match_events
ADD CONSTRAINT match_events_answered_by_tournament_player_id_fkey
  FOREIGN KEY (answered_by_tournament_player_id)
  REFERENCES tournament_players(id)
  ON DELETE SET NULL;

-- Fix answers table tournament_player reference
ALTER TABLE answers
DROP CONSTRAINT IF EXISTS answers_tournament_player_id_fkey;

ALTER TABLE answers
ADD CONSTRAINT answers_tournament_player_id_fkey
  FOREIGN KEY (tournament_player_id)
  REFERENCES tournament_players(id)
  ON DELETE CASCADE;

-- Fix matches table player references
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_player_a_fkey;

ALTER TABLE matches
ADD CONSTRAINT matches_player_a_fkey
  FOREIGN KEY (player_a)
  REFERENCES tournament_players(id)
  ON DELETE CASCADE;

ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_player_b_fkey;

ALTER TABLE matches
ADD CONSTRAINT matches_player_b_fkey
  FOREIGN KEY (player_b)
  REFERENCES tournament_players(id)
  ON DELETE CASCADE;