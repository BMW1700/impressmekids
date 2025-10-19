-- Phase 1 Fix: Create security definer functions to prevent infinite recursion

-- 1. Function to check if user is a parent (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_parent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_accounts
    WHERE user_id = _user_id
  )
$$;

-- 2. Function to get parent_id from user_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_parent_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.parent_accounts
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 3. Drop existing problematic policies on parent_accounts
DROP POLICY IF EXISTS "Parents can insert their own account" ON public.parent_accounts;
DROP POLICY IF EXISTS "Parents can view their own account" ON public.parent_accounts;

-- 4. Create new safe policies for parent_accounts
CREATE POLICY "Parents can insert their own account"
ON public.parent_accounts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Parents can view their own account"
ON public.parent_accounts
FOR SELECT
USING (user_id = auth.uid());

-- 5. Drop existing problematic policies on parent_student_links
DROP POLICY IF EXISTS "Parents can insert their own links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can view their own links" ON public.parent_student_links;

-- 6. Create new safe policies for parent_student_links using security definer function
CREATE POLICY "Parents can insert their own links"
ON public.parent_student_links
FOR INSERT
WITH CHECK (parent_id = public.get_parent_id(auth.uid()));

CREATE POLICY "Parents can view their own links"
ON public.parent_student_links
FOR SELECT
USING (parent_id = public.get_parent_id(auth.uid()));

-- 7. Update get_user_profile to return role from user_roles table
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
    p.role,  -- Keep this for backward compatibility in the return type
    p.email, 
    p.full_name
  FROM public.profiles p
  WHERE p.id = _user_id
  LIMIT 1;
END;
$$;

-- 8. Drop and recreate parent_access_requests policies to use security definer function
DROP POLICY IF EXISTS "Parents can create their own requests" ON public.parent_access_requests;
DROP POLICY IF EXISTS "Parents can view their own requests" ON public.parent_access_requests;

CREATE POLICY "Parents can create their own requests"
ON public.parent_access_requests
FOR INSERT
WITH CHECK (parent_id = public.get_parent_id(auth.uid()));

CREATE POLICY "Parents can view their own requests"
ON public.parent_access_requests
FOR SELECT
USING (parent_id = public.get_parent_id(auth.uid()));

-- 9. Update get_parent_account function to use security definer helper
CREATE OR REPLACE FUNCTION public.get_parent_account(_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, email text, full_name text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT pa.id, pa.user_id, pa.email, pa.full_name, pa.created_at
  FROM public.parent_accounts pa
  WHERE pa.user_id = _user_id;
END;
$$;

-- 10. Update get_parent_student_links function to use security definer helper
CREATE OR REPLACE FUNCTION public.get_parent_student_links(_user_id uuid)
RETURNS TABLE(link_id uuid, student_id uuid, student_name text, student_email text, student_grade integer, approved boolean, requested_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    psl.id as link_id,
    psl.student_id,
    p.full_name as student_name,
    p.email as student_email,
    sp.grade as student_grade,
    psl.approved,
    psl.requested_at
  FROM public.parent_student_links psl
  JOIN public.parent_accounts pa ON pa.id = psl.parent_id
  JOIN public.profiles p ON p.id = psl.student_id
  LEFT JOIN public.student_profiles sp ON sp.user_id = psl.student_id
  WHERE pa.user_id = _user_id
  ORDER BY psl.requested_at DESC;
END;
$$;