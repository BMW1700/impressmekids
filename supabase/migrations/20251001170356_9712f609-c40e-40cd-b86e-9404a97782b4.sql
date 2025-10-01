-- Ensure the user_role enum exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('teacher', 'student', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop and recreate the trigger function with safer role handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
  final_role user_role;
BEGIN
  -- Get the role from metadata, default to 'student'
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validate and safely cast to enum
  CASE user_role_text
    WHEN 'teacher' THEN final_role := 'teacher'::user_role;
    WHEN 'student' THEN final_role := 'student'::user_role;
    WHEN 'admin' THEN final_role := 'admin'::user_role;
    ELSE final_role := 'student'::user_role;
  END CASE;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();