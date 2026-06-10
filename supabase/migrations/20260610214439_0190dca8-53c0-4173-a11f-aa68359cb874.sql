-- has_verified_mfa: true iff user has a verified MFA factor
CREATE OR REPLACE FUNCTION public.has_verified_mfa(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.mfa_factors f
    WHERE f.user_id = _user_id
      AND f.status = 'verified'
  );
$$;

REVOKE ALL ON FUNCTION public.has_verified_mfa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_verified_mfa(uuid) TO authenticated, service_role;

-- is_coppa_blocked: true iff a user is an under-13 student without
-- recorded parental consent. Defaults to FALSE for anyone who isn't a
-- student or isn't under 13, so existing flows are unaffected.
CREATE OR REPLACE FUNCTION public.is_coppa_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_birth date;
  v_is_student boolean;
  v_has_consent boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'student'
  ) INTO v_is_student;

  IF NOT v_is_student THEN
    RETURN false;
  END IF;

  SELECT date_of_birth INTO v_birth
  FROM public.profiles
  WHERE id = _user_id;

  -- If we have no DOB we cannot prove >=13, so treat as blocked
  -- (safer default for COPPA).
  IF v_birth IS NULL THEN
    -- still allow if a parent consent record exists
    SELECT EXISTS (
      SELECT 1 FROM public.parent_consents
      WHERE student_id = _user_id
        AND (aura_recording_consent IS TRUE OR data_use_consent IS TRUE)
    ) INTO v_has_consent;
    RETURN NOT v_has_consent;
  END IF;

  -- Age >= 13: not blocked
  IF age(v_birth) >= interval '13 years' THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parent_consents
    WHERE student_id = _user_id
      AND (aura_recording_consent IS TRUE OR data_use_consent IS TRUE)
  ) INTO v_has_consent;

  RETURN NOT v_has_consent;
END;
$$;

REVOKE ALL ON FUNCTION public.is_coppa_blocked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_coppa_blocked(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.has_verified_mfa(uuid) IS
  'Returns true if the user has at least one verified MFA factor. Used by RequireMFA route guard and RLS policies on sensitive tables.';

COMMENT ON FUNCTION public.is_coppa_blocked(uuid) IS
  'Returns true if a student account is under 13 without verified parental consent. Non-students always return false.';
