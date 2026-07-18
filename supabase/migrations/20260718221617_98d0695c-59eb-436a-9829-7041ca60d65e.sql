ALTER TABLE public.challenge_settings
  ADD COLUMN IF NOT EXISTS lock_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_pin_hash text,
  ADD COLUMN IF NOT EXISTS lock_set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;