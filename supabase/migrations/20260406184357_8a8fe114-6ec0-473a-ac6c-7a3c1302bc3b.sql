
CREATE OR REPLACE FUNCTION public.validate_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.grade_mode NOT IN ('k5', '6to12') THEN
    RAISE EXCEPTION 'grade_mode must be k5 or 6to12';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_default_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.default_grade_mode NOT IN ('k5', '6to12') THEN
    RAISE EXCEPTION 'default_grade_mode must be k5 or 6to12';
  END IF;
  RETURN NEW;
END;
$$;
