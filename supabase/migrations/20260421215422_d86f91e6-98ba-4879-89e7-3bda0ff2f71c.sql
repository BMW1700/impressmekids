-- Email failures audit table for transactional email sends
CREATE TABLE IF NOT EXISTS public.email_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text,
  from_address text,
  error_code text,
  error_message text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  retry_count integer NOT NULL DEFAULT 0,
  function_name text,
  payload_summary jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_failures_attempted_at ON public.email_failures (attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_failures_function_name ON public.email_failures (function_name);
CREATE INDEX IF NOT EXISTS idx_email_failures_recipient ON public.email_failures (recipient_email);

ALTER TABLE public.email_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email failures"
ON public.email_failures
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'district_manager'::app_role)
);