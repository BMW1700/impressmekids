ALTER TABLE public.reading_sessions
  ADD COLUMN IF NOT EXISTS challenge_level smallint;

-- Backfill any existing rows so 'reading_mode' has a value for filtering.
UPDATE public.reading_sessions SET reading_mode = 'rpg_battle' WHERE reading_mode IS NULL;