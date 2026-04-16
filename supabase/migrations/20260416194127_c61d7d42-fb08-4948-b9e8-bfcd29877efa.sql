-- 1) Peek RPC: validate a class join code WITHOUT enrolling, so signup forms can pre-validate.
-- Returns minimal info (classroom name + teacher name) for confirmation UX.
-- SECURITY DEFINER + search_path locked. Auth NOT required (used pre-signup).
CREATE OR REPLACE FUNCTION public.peek_classroom_join_code(p_join_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_normalized text;
  v_classroom record;
BEGIN
  v_normalized := upper(trim(p_join_code));

  IF v_normalized IS NULL OR length(v_normalized) <> 6 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code must be 6 characters');
  END IF;

  SELECT c.id, c.name, c.subject, c.grade, p.full_name AS teacher_name
  INTO v_classroom
  FROM public.classrooms c
  LEFT JOIN public.profiles p ON p.id = c.teacher_id
  WHERE upper(c.join_code) = v_normalized
  LIMIT 1;

  IF v_classroom IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Class join code not found');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'classroom_name', v_classroom.name,
    'subject', v_classroom.subject,
    'grade', v_classroom.grade,
    'teacher_name', v_classroom.teacher_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.peek_classroom_join_code(text) TO anon, authenticated;

-- 2) Schedule cleanup of old sign-in attempts daily at 03:17 UTC.
-- Uses pg_cron (already enabled per prior migrations).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-signin-attempts-daily')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-signin-attempts-daily');

    PERFORM cron.schedule(
      'cleanup-signin-attempts-daily',
      '17 3 * * *',
      $job$ SELECT public.cleanup_old_signin_attempts(); $job$
    );
  END IF;
END
$$;