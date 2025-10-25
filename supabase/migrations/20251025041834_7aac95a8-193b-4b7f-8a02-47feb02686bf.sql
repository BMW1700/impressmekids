-- Step 1: Sync existing profiles with user_roles table (excluding parents)
-- Insert missing user_roles entries for all existing users except parents
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id,
  CASE p.role
    WHEN 'teacher'::user_role THEN 'teacher'::app_role
    WHEN 'student'::user_role THEN 'student'::app_role
    WHEN 'admin'::user_role THEN 'admin'::app_role
    ELSE 'student'::app_role
  END
FROM public.profiles p
WHERE p.role != 'parent'::user_role  -- Exclude parents - they're handled separately
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Create or replace trigger function to keep profiles and user_roles in sync
CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When profile role is updated or created, sync to user_roles (except parents)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Skip parents - they're managed via parent_accounts table
    IF NEW.role = 'parent'::user_role THEN
      RETURN NEW;
    END IF;
    
    -- Delete old role if it exists
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      CASE NEW.role
        WHEN 'teacher'::user_role THEN 'teacher'::app_role
        WHEN 'student'::user_role THEN 'student'::app_role
        WHEN 'admin'::user_role THEN 'admin'::app_role
        ELSE 'student'::app_role
      END
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on profiles table to auto-sync user_roles
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON public.profiles;
CREATE TRIGGER sync_user_roles_trigger
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_roles();

-- Step 4: Update get_user_profile to prioritize user_roles and handle parents correctly
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE(id uuid, role user_role, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id,
    -- Check parent_accounts first, then user_roles, then profiles.role as fallback
    COALESCE(
      -- If user is a parent (has entry in parent_accounts), return parent role
      CASE WHEN EXISTS (SELECT 1 FROM public.parent_accounts pa WHERE pa.user_id = p.id)
        THEN 'parent'::user_role
        ELSE NULL
      END,
      -- Otherwise check user_roles table
      CASE ur.role
        WHEN 'teacher'::app_role THEN 'teacher'::user_role
        WHEN 'student'::app_role THEN 'student'::user_role
        WHEN 'admin'::app_role THEN 'admin'::user_role
        ELSE NULL
      END,
      -- Final fallback to profiles.role
      p.role,
      'student'::user_role  -- Ultimate fallback
    ) as role,
    p.email,
    p.full_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  LIMIT 1;
END;
$$;