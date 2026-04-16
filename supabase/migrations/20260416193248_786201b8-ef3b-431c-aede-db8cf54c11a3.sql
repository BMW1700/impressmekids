
-- ============================================================================
-- Class join code redemption + Student ID sign-in rate limiting
-- ============================================================================

-- 1) Server-side RPC to safely add a student to a classroom by join code.
--    Runs as SECURITY DEFINER so it can resolve the classroom across RLS.
--    Caller must be the student being added (auth.uid() = p_student_id).
CREATE OR REPLACE FUNCTION public.redeem_classroom_join_code(
  p_student_id uuid,
  p_join_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_classroom_id uuid;
  v_normalized_code text;
BEGIN
  -- Auth check: only the student themselves may redeem
  IF auth.uid() IS NULL OR auth.uid() <> p_student_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  v_normalized_code := upper(trim(p_join_code));

  IF v_normalized_code IS NULL OR length(v_normalized_code) <> 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid join code format');
  END IF;

  SELECT id INTO v_classroom_id
  FROM public.classrooms
  WHERE upper(join_code) = v_normalized_code
  LIMIT 1;

  IF v_classroom_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class join code not found');
  END IF;

  INSERT INTO public.classroom_students (classroom_id, student_id)
  VALUES (v_classroom_id, p_student_id)
  ON CONFLICT (classroom_id, student_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'classroom_id', v_classroom_id
  );
END;
$$;

-- 2) Rate-limit table for Student ID sign-in attempts (per IP + per student_id).
--    Only used by the check_student_id_signin_rate RPC below.
CREATE TABLE IF NOT EXISTS public.student_id_signin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  student_id_attempt text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  succeeded boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_signin_attempts_ip_time
  ON public.student_id_signin_attempts (ip_hash, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_signin_attempts_studentid_time
  ON public.student_id_signin_attempts (student_id_attempt, attempted_at DESC);

ALTER TABLE public.student_id_signin_attempts ENABLE ROW LEVEL SECURITY;

-- No client-side access. Only SECURITY DEFINER RPC may read/write.
CREATE POLICY "no_direct_access_signin_attempts"
ON public.student_id_signin_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- 3) Rate-limit check + record RPC. Called BEFORE signInWithPassword.
--    Limits: max 10 failed attempts per ip_hash in 5 minutes,
--            max 5 failed attempts per student_id in 5 minutes.
CREATE OR REPLACE FUNCTION public.check_student_id_signin_rate(
  p_ip_hash text,
  p_student_id_attempt text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip_failures int;
  v_id_failures int;
BEGIN
  -- Validate inputs
  IF p_ip_hash IS NULL OR length(p_ip_hash) < 8 THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Invalid request');
  END IF;
  IF p_student_id_attempt IS NULL OR p_student_id_attempt !~ '^\d{8}$' THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Invalid Student ID format');
  END IF;

  -- Count recent failures
  SELECT count(*) INTO v_ip_failures
  FROM public.student_id_signin_attempts
  WHERE ip_hash = p_ip_hash
    AND succeeded = false
    AND attempted_at > now() - interval '5 minutes';

  SELECT count(*) INTO v_id_failures
  FROM public.student_id_signin_attempts
  WHERE student_id_attempt = p_student_id_attempt
    AND succeeded = false
    AND attempted_at > now() - interval '5 minutes';

  IF v_ip_failures >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Too many sign-in attempts from your network. Please wait a few minutes.'
    );
  END IF;

  IF v_id_failures >= 5 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Too many failed attempts for this Student ID. Please wait a few minutes.'
    );
  END IF;

  -- Pre-record the attempt as failed; client calls record_student_id_signin_result on success.
  INSERT INTO public.student_id_signin_attempts (ip_hash, student_id_attempt, succeeded)
  VALUES (p_ip_hash, p_student_id_attempt, false);

  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- 4) Mark the most recent attempt as succeeded so it doesn't count toward limits.
CREATE OR REPLACE FUNCTION public.record_student_id_signin_success(
  p_ip_hash text,
  p_student_id_attempt text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_id_signin_attempts
  SET succeeded = true
  WHERE id = (
    SELECT id FROM public.student_id_signin_attempts
    WHERE ip_hash = p_ip_hash
      AND student_id_attempt = p_student_id_attempt
      AND succeeded = false
    ORDER BY attempted_at DESC
    LIMIT 1
  );
END;
$$;

-- 5) Housekeeping: prune old rows (>1 day) opportunistically via a function admins can cron.
CREATE OR REPLACE FUNCTION public.cleanup_old_signin_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.student_id_signin_attempts
  WHERE attempted_at < now() - interval '1 day';
$$;
