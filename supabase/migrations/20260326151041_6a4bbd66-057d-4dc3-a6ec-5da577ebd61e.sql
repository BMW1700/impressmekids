-- CRITICAL: Fix COPPA consent tampering
DROP POLICY IF EXISTS "Allow consent verification" ON public.student_signup_consents;

CREATE POLICY "Allow consent verification by token"
ON public.student_signup_consents
FOR UPDATE
TO authenticated
USING (
  consent_token IS NOT NULL 
  AND consent_token = current_setting('request.headers', true)::json->>'x-consent-token'
)
WITH CHECK (
  consent_given = true 
  AND consent_date IS NOT NULL
);

CREATE POLICY "Service role can update consents"
ON public.student_signup_consents
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);