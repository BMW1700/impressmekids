-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_user_profile(uuid);

-- Recreate get_user_profile to include student_id
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE(id uuid, role text, email text, full_name text, student_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id,
    -- Priority order: district_manager → parent → user_roles → profiles fallback
    COALESCE(
      -- Check district_managers table first
      CASE WHEN EXISTS (SELECT 1 FROM public.district_managers dm WHERE dm.user_id = p.id)
        THEN 'district_manager'
        ELSE NULL
      END,
      -- Check parent_accounts table
      CASE WHEN EXISTS (SELECT 1 FROM public.parent_accounts pa WHERE pa.user_id = p.id)
        THEN 'parent'
        ELSE NULL
      END,
      -- Map user_roles to strings
      ur.role::text,
      -- Fallback to profiles.role
      p.role::text,
      'student'  -- Ultimate fallback
    ) as role,
    p.email,
    p.full_name,
    p.student_id
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  LIMIT 1;
END;
$$;