-- Drop the old function first since return type is changing
DROP FUNCTION IF EXISTS public.get_consent_by_token(text);

-- Recreate without password_temp
CREATE OR REPLACE FUNCTION public.get_consent_by_token(p_token TEXT)
RETURNS TABLE(
  id UUID,
  student_email TEXT,
  parent_name TEXT,
  full_name TEXT,
  district_id TEXT,
  student_role TEXT,
  consent_given BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ssc.id,
    ssc.student_email,
    ssc.parent_name,
    ssc.full_name,
    ssc.district_id,
    ssc.student_role,
    ssc.consent_given,
    ssc.expires_at
  FROM public.student_signup_consents ssc
  WHERE ssc.consent_token = p_token;
END;
$$;

-- Drop the password_temp column entirely
ALTER TABLE public.student_signup_consents DROP COLUMN IF EXISTS password_temp;
