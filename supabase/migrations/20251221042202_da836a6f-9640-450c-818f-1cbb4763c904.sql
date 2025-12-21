-- Add student_id column to profiles table (8-digit number only)
ALTER TABLE public.profiles 
ADD COLUMN student_id TEXT;

-- Create a function to validate 8-digit student ID
CREATE OR REPLACE FUNCTION validate_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NOT NULL AND NEW.student_id !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'student_id must be exactly 8 digits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate student_id on insert/update
CREATE TRIGGER validate_student_id_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION validate_student_id();