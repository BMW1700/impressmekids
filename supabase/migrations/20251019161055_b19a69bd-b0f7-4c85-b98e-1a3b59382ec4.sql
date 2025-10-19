-- Fix get_user_profile to actually use user_roles table
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE(id uuid, role user_role, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id,
    -- Get role from user_roles table, cast to user_role enum for backward compatibility
    CASE ur.role
      WHEN 'teacher'::app_role THEN 'teacher'::user_role
      WHEN 'student'::app_role THEN 'student'::user_role
      WHEN 'parent'::app_role THEN 'parent'::user_role
      WHEN 'admin'::app_role THEN 'admin'::user_role
      ELSE 'student'::user_role  -- fallback
    END as role,
    p.email,
    p.full_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  LIMIT 1;
END;
$$;