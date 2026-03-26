
-- Migration 1: Fix consent USING(true) regression
-- Drop the permissive policy that allows anyone to target any row
DROP POLICY IF EXISTS "Allow consent verification by token" ON public.student_signup_consents;

-- Consent verification is done via edge function using service_role
-- The existing "Service role can update consents" policy already handles this
-- No replacement needed for anon/authenticated — they should NOT update consent records directly
