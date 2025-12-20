-- Fix infinite recursion in profiles RLS by removing policies/functions that query profiles

-- 1) Drop policies that call is_same_district_secure (or any prior function)
DROP POLICY IF EXISTS "Admins can view all profiles with email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- 2) Drop the problematic function(s)
DROP FUNCTION IF EXISTS public.is_same_district_secure(uuid);
DROP FUNCTION IF EXISTS public.is_same_district(uuid);

-- 3) Recreate admin policies without querying profiles in subqueries (avoids recursion)
--    Uses district_admins -> districts to determine the admin's district, and compares against the row's district_id.

CREATE POLICY "Admins can view all profiles with email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.district_admins da
    JOIN public.districts d ON d.name = da.district_name
    WHERE da.user_id = auth.uid()
      AND public.profiles.district_id = d.district_code
  )
);

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.district_admins da
    JOIN public.districts d ON d.name = da.district_name
    WHERE da.user_id = auth.uid()
      AND public.profiles.district_id = d.district_code
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.district_admins da
    JOIN public.districts d ON d.name = da.district_name
    WHERE da.user_id = auth.uid()
      AND public.profiles.district_id = d.district_code
  )
);
