-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION validate_student_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NOT NULL AND NEW.student_id !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'student_id must be exactly 8 digits';
  END IF;
  RETURN NEW;
END;
$$;