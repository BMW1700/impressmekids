-- Policy for district managers to view their own record
CREATE POLICY "District managers can view their own record"
ON public.district_managers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());