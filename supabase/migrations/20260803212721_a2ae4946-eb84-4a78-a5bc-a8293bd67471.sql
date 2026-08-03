-- 1. Student classroom credentials -------------------------------------------
CREATE TABLE public.student_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  must_reset BOOLEAN NOT NULL DEFAULT false,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX student_credentials_user_id_key
  ON public.student_credentials (user_id);
CREATE UNIQUE INDEX student_credentials_classroom_username_key
  ON public.student_credentials (classroom_id, lower(username));
CREATE INDEX student_credentials_username_idx
  ON public.student_credentials (lower(username));

GRANT SELECT ON public.student_credentials TO authenticated;
GRANT ALL ON public.student_credentials TO service_role;

ALTER TABLE public.student_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own credential row"
  ON public.student_credentials FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view credentials for their classroom"
  ON public.student_credentials FOR SELECT TO authenticated
  USING (
    classroom_id IS NOT NULL
    AND public.is_teacher_of_classroom(classroom_id)
  );

CREATE POLICY "Admins can view credentials"
  ON public.student_credentials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER student_credentials_updated_at
  BEFORE UPDATE ON public.student_credentials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Classroom login attempts --------------------------------------------------
CREATE TABLE public.classroom_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT,
  classroom_code TEXT,
  ip_bucket TEXT NOT NULL DEFAULT 'no-ip-collected',
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX classroom_login_attempts_lookup_idx
  ON public.classroom_login_attempts (lower(username), created_at DESC);
CREATE INDEX classroom_login_attempts_ip_idx
  ON public.classroom_login_attempts (ip_bucket, created_at DESC);

GRANT ALL ON public.classroom_login_attempts TO service_role;

ALTER TABLE public.classroom_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can review login attempts"
  ON public.classroom_login_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 3. Durable AI evaluation jobs -------------------------------------------------
CREATE TABLE public.ai_evaluation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'aura_reading',
  status TEXT NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_evaluation_jobs_status_check
    CHECK (status IN ('queued','processing','completed','failed'))
);

CREATE UNIQUE INDEX ai_evaluation_jobs_idempotency_key
  ON public.ai_evaluation_jobs (idempotency_key);
CREATE INDEX ai_evaluation_jobs_pending_idx
  ON public.ai_evaluation_jobs (status, next_attempt_at);
CREATE INDEX ai_evaluation_jobs_user_idx
  ON public.ai_evaluation_jobs (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.ai_evaluation_jobs TO authenticated;
GRANT ALL ON public.ai_evaluation_jobs TO service_role;

ALTER TABLE public.ai_evaluation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI jobs"
  ON public.ai_evaluation_jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can queue their own AI jobs"
  ON public.ai_evaluation_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view their students' AI jobs"
  ON public.ai_evaluation_jobs FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE TRIGGER ai_evaluation_jobs_updated_at
  BEFORE UPDATE ON public.ai_evaluation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Atomic job claim for controlled concurrency ---------------------------------
CREATE OR REPLACE FUNCTION public.claim_ai_evaluation_jobs(_limit INTEGER DEFAULT 3)
RETURNS SETOF public.ai_evaluation_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.ai_evaluation_jobs j
  SET status = 'processing',
      locked_at = now(),
      started_at = COALESCE(j.started_at, now()),
      attempts = j.attempts + 1
  WHERE j.id IN (
    SELECT id FROM public.ai_evaluation_jobs
    WHERE (status = 'queued' AND next_attempt_at <= now())
       OR (status = 'processing' AND locked_at < now() - INTERVAL '5 minutes')
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(_limit, 1)
  )
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_evaluation_jobs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ai_evaluation_jobs(INTEGER) TO service_role;