-- Drop the problematic policies that use is_same_district
DROP POLICY IF EXISTS "Admins can view all profiles with email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Create secure function to check same district (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_same_district_secure(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
      AND p2.id = target_user_id
      AND p1.district_id IS NOT NULL
      AND p1.district_id = p2.district_id
  );
$$;

-- Recreate policies using the secure function with correct enum value
CREATE POLICY "Admins can view all profiles with email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND public.is_same_district_secure(id)
);

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND public.is_same_district_secure(id)
);

-- Drop the old function that caused recursion
DROP FUNCTION IF EXISTS public.is_same_district(uuid);