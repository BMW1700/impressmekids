-- Create SECURITY DEFINER function to safely get user's district_id
CREATE OR REPLACE FUNCTION public.get_user_district_id(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN (
    SELECT district_id 
    FROM public.profiles 
    WHERE id = _user_id
    LIMIT 1
  );
END;
$$;

-- Drop and recreate districts policies to use the new function
DROP POLICY IF EXISTS "Authenticated users within district can view" ON public.districts;
CREATE POLICY "Authenticated users within district can view" ON public.districts
  FOR SELECT USING (
    is_visible = true
    OR district_code = public.get_user_district_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "District admins can update their district" ON public.districts;
CREATE POLICY "District admins can update their district" ON public.districts
  FOR UPDATE USING (
    district_code = public.get_user_district_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.district_admins da
      WHERE da.user_id = auth.uid()
    )
  );