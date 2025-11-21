-- Allow anonymous users to view districts for signup flow
-- This is safe because district names and codes are public information needed during registration
CREATE POLICY "Anonymous users can view districts for signup"
ON public.districts
FOR SELECT
TO anon
USING (true);