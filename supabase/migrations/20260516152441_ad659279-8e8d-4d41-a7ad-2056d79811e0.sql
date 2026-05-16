-- Make player_inventory grade-mode scoped so K-5 and Agent inventories don't collide
ALTER TABLE public.player_inventory
  ADD COLUMN IF NOT EXISTS grade_mode text NOT NULL DEFAULT 'k5';

-- Drop the old (student, item) unique constraint and replace with (student, grade_mode, item)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_inventory_student_id_item_id_key') THEN
    ALTER TABLE public.player_inventory DROP CONSTRAINT player_inventory_student_id_item_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS player_inventory_student_grade_item_uniq
  ON public.player_inventory (student_id, grade_mode, item_id);

-- Validation trigger for grade_mode values
CREATE OR REPLACE FUNCTION public.validate_player_inventory_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.grade_mode IS NULL OR NEW.grade_mode NOT IN ('k5','6to12') THEN
    NEW.grade_mode := 'k5';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_player_inventory_grade_mode_trg ON public.player_inventory;
CREATE TRIGGER validate_player_inventory_grade_mode_trg
  BEFORE INSERT OR UPDATE ON public.player_inventory
  FOR EACH ROW EXECUTE FUNCTION public.validate_player_inventory_grade_mode();