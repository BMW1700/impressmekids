-- Update the get_user_profile function to properly bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  role user_role,
  email text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this function's queries to prevent infinite recursion
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT p.id, p.role, p.email, p.full_name
  FROM public.profiles p
  WHERE p.id = _user_id;
END;
$$;