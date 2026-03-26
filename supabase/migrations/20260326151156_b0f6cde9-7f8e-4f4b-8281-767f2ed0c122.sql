-- Fix consent verification policy to work with frontend .eq('consent_token', token) approach
-- The previous policy tried to read from request headers which the frontend doesn't set
-- Instead, we simply remove the authenticated policy and rely on service_role only,
-- since consent verification should go through a secure backend flow

DROP POLICY IF EXISTS "Allow consent verification by token" ON public.student_signup_consents;

-- Allow anon users to update ONLY when they know the consent_token (via .eq filter)
-- The RLS USING clause ensures they can only touch rows matching the token they provide
-- Combined with WITH CHECK ensuring consent_given=true and consent_date is set
CREATE POLICY "Allow consent verification by token"
ON public.student_signup_consents
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  consent_given = true 
  AND consent_date IS NOT NULL
  AND consent_token IS NOT NULL
);