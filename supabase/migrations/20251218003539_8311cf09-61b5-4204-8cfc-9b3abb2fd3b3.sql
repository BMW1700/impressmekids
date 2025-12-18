
-- Fix CRITICAL COPPA vulnerability: Public exposure of children's PII in student_signup_consents

-- Step 1: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can verify consent" ON student_signup_consents;

-- Step 2: Create a secure RPC function to check if consent exists by student email
-- This only returns id and consent_given - no PII exposed
CREATE OR REPLACE FUNCTION check_consent_exists(p_student_email TEXT)
RETURNS TABLE(id UUID, consent_given BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.consent_given
  FROM student_signup_consents sc
  WHERE sc.student_email = p_student_email
  LIMIT 1;
END;
$$;

-- Step 3: Create a secure RPC function to get consent data by token only
-- This returns the data needed for ConsentVerification page
CREATE OR REPLACE FUNCTION get_consent_by_token(p_token TEXT)
RETURNS TABLE(
  id UUID,
  student_email TEXT,
  parent_name TEXT,
  full_name TEXT,
  district_id TEXT,
  password_temp TEXT,
  student_role TEXT,
  consent_given BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.student_email,
    sc.parent_name,
    sc.full_name,
    sc.district_id,
    sc.password_temp,
    sc.student_role,
    sc.consent_given,
    sc.expires_at
  FROM student_signup_consents sc
  WHERE sc.consent_token = p_token;
END;
$$;

-- Step 4: Grant execute permissions on the RPC functions
GRANT EXECUTE ON FUNCTION check_consent_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_consent_by_token(TEXT) TO anon, authenticated;
