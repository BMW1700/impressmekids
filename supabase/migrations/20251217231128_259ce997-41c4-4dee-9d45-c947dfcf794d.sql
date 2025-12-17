-- Allow admins to update any profile's is_verified field
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also allow district admins to update profiles in their district
CREATE POLICY "District admins can update profiles in their district"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND profiles.district_id IN (
      SELECT d.district_code FROM districts d WHERE d.name = da.district_name
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND profiles.district_id IN (
      SELECT d.district_code FROM districts d WHERE d.name = da.district_name
    )
  )
);