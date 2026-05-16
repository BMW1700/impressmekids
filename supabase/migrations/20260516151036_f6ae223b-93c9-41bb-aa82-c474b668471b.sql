-- Add grade_mode to player_pets so K-5 and 6-12 pets are separated
ALTER TABLE public.player_pets
  ADD COLUMN IF NOT EXISTS grade_mode text NOT NULL DEFAULT 'k5';

-- Drop old per-student/type unique if any, add scoped unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'player_pets_student_id_pet_type_key'
  ) THEN
    ALTER TABLE public.player_pets DROP CONSTRAINT player_pets_student_id_pet_type_key;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS player_pets_student_grade_pet_uniq
  ON public.player_pets (student_id, grade_mode, pet_type);

-- Validate grade_mode values
CREATE OR REPLACE FUNCTION public.validate_player_pets_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.grade_mode NOT IN ('k5','6to12') THEN
    RAISE EXCEPTION 'grade_mode must be k5 or 6to12';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_player_pets_grade_mode_trg ON public.player_pets;
CREATE TRIGGER validate_player_pets_grade_mode_trg
  BEFORE INSERT OR UPDATE ON public.player_pets
  FOR EACH ROW EXECUTE FUNCTION public.validate_player_pets_grade_mode();