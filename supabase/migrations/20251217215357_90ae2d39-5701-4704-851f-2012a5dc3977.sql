-- Add UPDATE policy to allow anonymous users to verify consent by token
CREATE POLICY "Anyone can verify consent by token"
ON student_signup_consents
FOR UPDATE
TO anon, public
USING (true)
WITH CHECK (consent_given = true AND consent_date IS NOT NULL);