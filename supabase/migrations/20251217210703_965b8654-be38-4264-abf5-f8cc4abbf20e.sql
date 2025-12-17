-- Allow anonymous users to insert consent requests (needed for under-13 signup flow)
CREATE POLICY "Anyone can request consent" 
ON public.student_signup_consents 
FOR INSERT 
TO anon
WITH CHECK (true);