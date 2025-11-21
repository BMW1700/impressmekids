-- Allow district managers to update district names
CREATE POLICY "District managers can update districts"
ON public.districts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_managers
    WHERE district_managers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.district_managers
    WHERE district_managers.user_id = auth.uid()
  )
);

-- Allow district managers to view all district managers
CREATE POLICY "District managers can view all district managers"
ON public.district_managers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_managers dm
    WHERE dm.user_id = auth.uid()
  )
);

-- Allow district managers to delete district managers
CREATE POLICY "District managers can delete district managers"
ON public.district_managers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_managers dm
    WHERE dm.user_id = auth.uid()
  )
);