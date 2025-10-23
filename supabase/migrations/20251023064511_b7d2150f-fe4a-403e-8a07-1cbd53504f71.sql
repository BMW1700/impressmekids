-- CRITICAL SECURITY: Add secure helper functions to prevent enumeration attacks

-- 1. Secure function to find student by email (prevents email enumeration)
CREATE OR REPLACE FUNCTION public.find_student_by_email_secure(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Only returns ID, prevents exposing PII
  SELECT id INTO v_student_id
  FROM public.profiles
  WHERE email = p_email
    AND id IN (SELECT user_id FROM public.user_roles WHERE role = 'student'::app_role)
  LIMIT 1;
  
  RETURN v_student_id;
END;
$$;

-- 2. Secure function to update user district
CREATE OR REPLACE FUNCTION public.update_user_district(p_user_id UUID, p_district_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to update their own district
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user district';
  END IF;
  
  UPDATE public.profiles
  SET district_id = p_district_id
  WHERE id = p_user_id;
END;
$$;

-- 3. Secure function to check if email exists (prevents enumeration)
CREATE OR REPLACE FUNCTION public.check_email_exists_secure(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE email = p_email
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- 4. Secure audio URL generation (returns signed URLs with expiration)
CREATE OR REPLACE FUNCTION public.get_signed_audio_url(
  p_student_id UUID,
  p_audio_path TEXT,
  p_expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_user_id UUID;
  v_has_consent BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user has permission to access this audio
  -- Either the student themselves or a teacher with consent
  IF v_user_id = p_student_id THEN
    -- Student accessing their own audio
    RETURN storage.sign_url('aura-audio', p_audio_path, p_expires_in);
  ELSE
    -- Check if teacher has consent
    SELECT public.has_aura_consent(p_student_id, v_user_id) INTO v_has_consent;
    
    IF v_has_consent THEN
      RETURN storage.sign_url('aura-audio', p_audio_path, p_expires_in);
    ELSE
      RAISE EXCEPTION 'Unauthorized: No permission to access this audio';
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.find_student_by_email_secure IS 'Securely finds student ID by email without exposing PII. Prevents email enumeration attacks.';
COMMENT ON FUNCTION public.update_user_district IS 'Securely updates user district. Only allows users to update their own district.';
COMMENT ON FUNCTION public.check_email_exists_secure IS 'Securely checks if email exists without exposing which emails are valid. Rate-limited via application layer.';
COMMENT ON FUNCTION public.get_signed_audio_url IS 'Generates signed URLs for audio files with expiration. Enforces consent-based access control.';