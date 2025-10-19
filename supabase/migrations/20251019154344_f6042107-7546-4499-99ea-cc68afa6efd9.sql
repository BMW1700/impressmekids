-- ============================================
-- UPDATE TRIGGER TO MANAGE USER_ROLES TABLE
-- ============================================

-- Drop and recreate the user creation trigger to insert into user_roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
  final_role app_role;  -- Using app_role enum
  final_user_role user_role;  -- Using user_role enum for profiles
  user_email TEXT;
  email_domain TEXT;
  matched_district_id UUID;
BEGIN
  -- Get email and extract domain
  user_email := NEW.email;
  email_domain := split_part(user_email, '@', 2);
  
  -- Check if email domain matches any district
  SELECT id INTO matched_district_id
  FROM public.districts
  WHERE email_domain = ANY(email_domains)
  LIMIT 1;
  
  -- Get the role from metadata, default to 'student'
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validate and safely cast to both enums
  CASE user_role_text
    WHEN 'teacher' THEN 
      final_role := 'teacher'::app_role;
      final_user_role := 'teacher'::user_role;
    WHEN 'student' THEN 
      final_role := 'student'::app_role;
      final_user_role := 'student'::user_role;
    WHEN 'admin' THEN 
      final_role := 'admin'::app_role;
      final_user_role := 'admin'::user_role;
    WHEN 'parent' THEN 
      final_role := 'parent'::app_role;
      final_user_role := 'parent'::user_role;
    ELSE 
      final_role := 'student'::app_role;
      final_user_role := 'student'::user_role;
  END CASE;
  
  -- Insert into profiles table (kept for backward compatibility)
  INSERT INTO public.profiles (id, email, full_name, role, signup_domain, district_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_user_role,
    email_domain,
    matched_district_id
  );
  
  -- CRITICAL: Insert into user_roles table - this is the authoritative role source
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREATE FUNCTION TO GET USER ROLE SAFELY
-- ============================================

-- This function returns the user's role from user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update get_user_profile to use user_roles (returns user_role enum for compatibility)
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE(id uuid, role user_role, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this function's queries to prevent infinite recursion
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id, 
    p.role,  -- Use profiles.role for backward compatibility
    p.email, 
    p.full_name
  FROM public.profiles p
  WHERE p.id = _user_id
  LIMIT 1;
END;
$$;