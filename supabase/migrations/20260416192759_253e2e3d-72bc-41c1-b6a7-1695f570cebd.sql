-- Auto-confirm synthetic student accounts at the moment of auth.users insert.
-- Hard-restricted to the synthetic domain so real teacher/parent emails are
-- never auto-confirmed (they still go through normal email verification).

CREATE OR REPLACE FUNCTION public.auto_confirm_synthetic_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND NEW.email LIKE '%@student.yubilearn.internal'
     AND NEW.email_confirmed_at IS NULL
  THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_synthetic_student_trigger ON auth.users;

CREATE TRIGGER auto_confirm_synthetic_student_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_synthetic_student();