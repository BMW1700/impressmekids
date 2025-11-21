-- Drop conflicting policies
DROP POLICY IF EXISTS "District managers can view all district managers" ON public.district_managers;
DROP POLICY IF EXISTS "District managers can view all districts" ON public.districts;
DROP POLICY IF EXISTS "District managers can create districts" ON public.districts;
DROP POLICY IF EXISTS "District managers can update districts" ON public.districts;

-- Create security definer function to check if user is a district manager
CREATE OR REPLACE FUNCTION public.is_district_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.district_managers
    WHERE user_id = _user_id
  )
$$;

-- Replace with non-recursive policy using the function
CREATE POLICY "District managers can view all district managers"
ON public.district_managers
FOR SELECT
TO authenticated
USING (public.is_district_manager(auth.uid()));

-- Update districts policies to use the function
CREATE POLICY "District managers can view all districts"
ON public.districts
FOR SELECT
TO authenticated
USING (public.is_district_manager(auth.uid()));

CREATE POLICY "District managers can create districts"
ON public.districts
FOR INSERT
TO authenticated
WITH CHECK (public.is_district_manager(auth.uid()));

CREATE POLICY "District managers can update districts"
ON public.districts
FOR UPDATE
TO authenticated
USING (public.is_district_manager(auth.uid()))
WITH CHECK (public.is_district_manager(auth.uid()));