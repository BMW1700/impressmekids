
ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS opening_trim_in_seconds  numeric NULL,
  ADD COLUMN IF NOT EXISTS opening_trim_out_seconds numeric NULL,
  ADD COLUMN IF NOT EXISTS closing_trim_in_seconds  numeric NULL,
  ADD COLUMN IF NOT EXISTS closing_trim_out_seconds numeric NULL;

ALTER TABLE public.prek_level_words
  ADD COLUMN IF NOT EXISTS first_trim_in_seconds   numeric NULL,
  ADD COLUMN IF NOT EXISTS first_trim_out_seconds  numeric NULL,
  ADD COLUMN IF NOT EXISTS second_trim_in_seconds  numeric NULL,
  ADD COLUMN IF NOT EXISTS second_trim_out_seconds numeric NULL;
